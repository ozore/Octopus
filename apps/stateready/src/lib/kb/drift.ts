/**
 * Run-time half of M14 (`specs/14` §The two halves, B): the daily source-drift
 * check, run on the platform's job queue and drained by Vercel Cron.
 *
 * **Nothing here auto-publishes and nothing here edits a record.** The only
 * write is a `kb_drift_items` row (invariant 5). Acceptance is a human act that
 * lands as a commit through `kb-scripts/accept_drift.py`; the runtime never
 * mutates the repo. That gate is the reason this product can charge for
 * correctness.
 *
 * FETCHING IS INJECTED. `runDriftCheck` takes a `fetcher`; the job handler
 * passes a real one and the tests pass a mock, so the suite never touches the
 * network (`PIPELINE.md` standing rules; `vitest.base.ts`).
 *
 * THE CRAWL IS SERIAL, 1.5 s APART, TWO ATTEMPTS. tdlr.texas.gov resets the
 * connection on roughly one request in ten when a client walks several of its
 * pages in a row (`product/CLAUDE.md`), and a job that treated a reset as a
 * change would page a human every week for nothing. Never parallelise it.
 */

import { newId } from '@octopus/platform';
import { and, eq, isNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { kbDriftItems, kbSources, licences } from '../schema';
import { contentHash, normalise } from './normalise';
import { recordsCitingSource } from './snapshot';

export type FetchResult = {
  status: number;
  body: string;
  contentType: string;
};

export type Fetcher = (url: string) => Promise<FetchResult>;

export const POLITE_DELAY_MS = 1_500;
export const UNREACHABLE_DAYS_BEFORE_ITEM = 3;

export type DriftOutcome =
  | 'unchanged'
  | 'drifted'
  | 'unreachable'
  | 'skipped_binary'
  | 'normalisation_parity';

export type DriftReport = {
  checked: number;
  unchanged: number;
  drifted: number;
  unreachable: number;
  skippedBinary: number;
  parity: number;
  itemsOpened: string[];
  outcomes: { sourceId: string; outcome: DriftOutcome }[];
};

function isBinary(contentType: string, body: string): boolean {
  const ct = contentType.toLowerCase();
  if (ct.includes('pdf') || ct.includes('msword') || ct.includes('officedocument')) return true;
  return body.startsWith('%PDF');
}

/**
 * How many customers rely on this source, so the queue is ordered by blast
 * radius rather than by arrival (`specs/14`). A fee change on a Texas page that
 * 40 customers depend on outranks a typo fix on a page nobody has a licence
 * under.
 */
async function affectedOrganisationCount(db: Db, recordIds: string[]): Promise<number> {
  if (recordIds.length === 0) return 0;
  const pairs = recordIds
    .map((id) => id.split('.'))
    .filter((parts): parts is [string, string] => parts.length === 2)
    .map(([state, trade]) => ({ state: state.toUpperCase(), trade }));
  const rows = await db
    .select({ orgId: licences.orgId, state: licences.state, trade: licences.trade })
    .from(licences)
    .where(eq(licences.status, 'active'));
  const orgs = new Set(
    rows.filter((r) => pairs.some((p) => p.state === r.state && p.trade === r.trade)).map((r) => r.orgId),
  );
  return orgs.size;
}

export async function runDriftCheck(
  db: Db,
  fetcher: Fetcher,
  options: { now?: Date; delayMs?: number; onlySourceIds?: string[] } = {},
): Promise<DriftReport> {
  const now = options.now ?? new Date();
  const delayMs = options.delayMs ?? POLITE_DELAY_MS;
  const sources = await db.select().from(kbSources);
  const wanted = options.onlySourceIds ? new Set(options.onlySourceIds) : null;
  const targets = sources.filter((s) => !wanted || wanted.has(s.sourceId));

  const report: DriftReport = {
    checked: 0,
    unchanged: 0,
    drifted: 0,
    unreachable: 0,
    skippedBinary: 0,
    parity: 0,
    itemsOpened: [],
    outcomes: [],
  };

  for (const [index, source] of targets.entries()) {
    if (index > 0 && delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    report.checked += 1;

    let result: FetchResult;
    try {
      result = await fetcher(source.url);
    } catch (error) {
      result = { status: 0, body: String(error), contentType: '' };
    }

    if (result.status !== 200 || !result.body) {
      const failures = source.consecutiveFailures + 1;
      await db
        .update(kbSources)
        .set({ consecutiveFailures: failures, lastCheckedAt: now, lastStatus: result.status })
        .where(eq(kbSources.sourceId, source.sourceId));
      report.unreachable += 1;
      report.outcomes.push({ sourceId: source.sourceId, outcome: 'unreachable' });

      // A board moving a page is as important as a board changing one — but a
      // transient reset is not news. Three consecutive days, and the counter
      // lives here because `refresh_sources.py` has no notion of "consecutive".
      if (failures >= UNREACHABLE_DAYS_BEFORE_ITEM) {
        const id = await openItem(db, {
          sourceId: source.sourceId,
          kind: 'source_unreachable',
          previous: source.baselineSha256,
          current: null,
          summary: `Unreachable for ${failures} consecutive checks (last HTTP ${result.status}). Find the new location for ${source.url}.`,
          url: source.url,
          now,
        });
        if (id) report.itemsOpened.push(id);
      }
      continue;
    }

    if (isBinary(result.contentType, result.body)) {
      await db
        .update(kbSources)
        .set({ consecutiveFailures: 0, lastCheckedAt: now, lastStatus: result.status })
        .where(eq(kbSources.sourceId, source.sourceId));
      report.skippedBinary += 1;
      report.outcomes.push({ sourceId: source.sourceId, outcome: 'skipped_binary' });
      continue;
    }

    const text = normalise(result.body);
    const hash = contentHash(text);
    await db
      .update(kbSources)
      .set({ consecutiveFailures: 0, lastCheckedAt: now, lastStatus: result.status })
      .where(eq(kbSources.sourceId, source.sourceId));

    if (hash === source.baselineSha256) {
      report.unchanged += 1;
      report.outcomes.push({ sourceId: source.sourceId, outcome: 'unchanged' });
      continue;
    }

    // A different hash with identical head AND tail excerpts is a
    // normalisation-parity signal, not a content change. Saying so is the
    // difference between a queue that is read and a queue that is abandoned.
    const head = text.slice(0, 4000);
    const tail = text.length > 4000 ? text.slice(-4000) : '';
    const parity =
      source.baselineHead !== null &&
      source.baselineHead === head &&
      (source.baselineTail ?? '') === tail;

    const recordIds = await recordsCitingSource(db, source.url);
    const affectedOrgs = await affectedOrganisationCount(db, recordIds);
    const id = await openItem(db, {
      sourceId: source.sourceId,
      kind: parity ? 'normalisation_parity' : 'content_changed',
      previous: source.baselineSha256,
      current: hash,
      summary: parity
        ? 'The page hashes differently but the stored head and tail excerpts are identical. This is most likely a normalisation difference between the app and kb-scripts, not a rule change — compare before treating it as content.'
        : summarise(source.baselineHead, source.baselineTail, head, tail),
      recordIds,
      affectedOrgs,
      url: source.url,
      now,
    });
    if (parity) {
      report.parity += 1;
      report.outcomes.push({ sourceId: source.sourceId, outcome: 'normalisation_parity' });
    } else {
      report.drifted += 1;
      report.outcomes.push({ sourceId: source.sourceId, outcome: 'drifted' });
    }
    if (id) report.itemsOpened.push(id);
  }

  return report;
}

/**
 * The honest limit `specs/14` §Data model states: where the change falls
 * outside both stored windows the screen says so and links the live page,
 * rather than showing a diff it cannot compute. A diff that silently omits the
 * change is worse than no diff.
 */
function summarise(
  baselineHead: string | null,
  baselineTail: string | null,
  head: string,
  tail: string,
): string {
  const headChanged = (baselineHead ?? '') !== head;
  const tailChanged = (baselineTail ?? '') !== tail;
  if (!baselineHead) return 'No baseline excerpt stored for this source; open the live page to see what changed.';
  if (!headChanged && !tailChanged) {
    return 'The change is outside both stored excerpts. Open the live page — we cannot show you a diff we do not have.';
  }
  const parts: string[] = [];
  if (headChanged) parts.push(firstDifference(baselineHead, head, 'start'));
  if (tailChanged) parts.push(firstDifference(baselineTail ?? '', tail, 'end'));
  return parts.join(' · ');
}

function firstDifference(before: string, after: string, where: string): string {
  let i = 0;
  while (i < before.length && i < after.length && before[i] === after[i]) i += 1;
  const context = 120;
  const from = Math.max(0, i - 40);
  return `${where}: "…${before.slice(from, from + context)}…" → "…${after.slice(from, from + context)}…"`;
}

async function openItem(
  db: Db,
  input: {
    sourceId: string;
    kind: string;
    previous: string | null;
    current: string | null;
    summary: string;
    recordIds?: string[];
    affectedOrgs?: number;
    url: string;
    now: Date;
  },
): Promise<string | null> {
  // Idempotent per day per source: the same detected hash never opens a second
  // item, because Vercel cron delivery is best effort and may repeat.
  const existing = await db
    .select({ id: kbDriftItems.id })
    .from(kbDriftItems)
    .where(
      and(
        eq(kbDriftItems.sourceId, input.sourceId),
        input.current === null
          ? isNull(kbDriftItems.currentSha256)
          : eq(kbDriftItems.currentSha256, input.current),
      ),
    )
    .limit(1);
  if (existing[0]) return null;

  const id = newId('kbd');
  await db.insert(kbDriftItems).values({
    id,
    sourceId: input.sourceId,
    detectedAt: input.now,
    kind: input.kind,
    previousSha256: input.previous,
    currentSha256: input.current,
    diffSummary: input.summary,
    affectedRecordIds: input.recordIds ?? [],
    affectedOrganisations: input.affectedOrgs ?? 0,
    status: 'open',
  });
  return id;
}

/**
 * `resolveDriftItem` — `specs/14` AC6.
 *
 * **`no_change` does not close the item.** It records the decision and leaves it
 * visibly `no_change — awaiting acceptance`, with the exact command, until a
 * deploy lands whose baseline matches. The wave-1 behaviour ("close it without
 * touching any record") meant the cron re-detected the identical drift tomorrow
 * and every day after, on the item class the spec itself says will be the most
 * common — and `/admin/kb` would be abandoned in week one.
 */
export async function resolveDriftItem(
  db: Db,
  input: { id: string; status: 'reviewing' | 'no_change' | 'corrected' | 'dismissed'; note?: string; userId?: string },
): Promise<{ status: string; awaitingAcceptance: boolean; command: string | null }> {
  const rows = await db.select().from(kbDriftItems).where(eq(kbDriftItems.id, input.id)).limit(1);
  const item = rows[0];
  if (!item) throw new Error(`no drift item ${input.id}`);

  const awaitingAcceptance = input.status === 'no_change';
  await db
    .update(kbDriftItems)
    .set({
      status: input.status,
      awaitingAcceptance,
      resolutionNote: input.note ?? null,
      resolvedByUserId: input.userId ?? null,
      resolvedAt: new Date(),
    })
    .where(eq(kbDriftItems.id, input.id));

  return {
    status: input.status,
    awaitingAcceptance,
    command: awaitingAcceptance
      ? `python3 phase-4-revenue/stateready/kb-scripts/accept_drift.py --source-id ${item.sourceId}`
      : null,
  };
}

/**
 * Closes any `no_change — awaiting acceptance` item whose hash the baseline has
 * caught up with. Called after a snapshot load, which is when a deploy carrying
 * the accepted baseline arrives.
 */
export async function closeAcceptedItems(db: Db): Promise<number> {
  const items = await db
    .select()
    .from(kbDriftItems)
    .where(and(eq(kbDriftItems.status, 'no_change'), eq(kbDriftItems.awaitingAcceptance, true)));
  let closed = 0;
  for (const item of items) {
    const source = (
      await db.select().from(kbSources).where(eq(kbSources.sourceId, item.sourceId)).limit(1)
    )[0];
    if (source && source.baselineSha256 === item.currentSha256) {
      await db
        .update(kbDriftItems)
        .set({ awaitingAcceptance: false, resolvedAt: new Date() })
        .where(eq(kbDriftItems.id, item.id));
      closed += 1;
    }
  }
  return closed;
}
