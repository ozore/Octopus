/**
 * INGESTION — the only writer of the corpus.
 *
 * Five properties, each a code path and not a rule (KNOWLEDGE_BASE §4.2):
 *
 *  1. **Append-only.** A determination row is written ONCE. There is no
 *     function in this module that updates `documentText`, `baseRate` or
 *     `fringeRate`; a new modification is a NEW ROW, and the old row gains
 *     `supersededById` and `isActive = false` while keeping every byte of its
 *     text and every one of its rates (gate G2, WL-13 V7).
 *  2. **A superseded revision goes through exactly the same path as an active
 *     one** — same parser, same transaction, same gates, same provenance
 *     columns. THERE IS NO LITE INGEST (WL-13 V9). A rate we may have to defend
 *     in year three is not a second-class row, and that sentence is what turns
 *     the differentiator from copy into a property of the corpus.
 *  3. **`isActive` is derived from the index and from `/history`'s own flag,
 *     never from "is this the newest row we hold"** (WL-13 V10). Fetching mod 0
 *     after mod 1 must not flip mod 1 to inactive.
 *  4. **Every classification row carries its own provenance** — wd number,
 *     modification, publication date, source url, last verified (gate G1,
 *     PLAN.md A10). Not a join away: on the row.
 *  5. **Idempotent.** Re-running a refresh writes no new row and moves only
 *     `lastVerified` forward.
 */

import { and, eq, inArray, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';

import { newId } from '@octopus/platform';
import { withTx, type Db } from '@octopus/platform/db';

import {
  kbClassifications,
  kbCounties,
  kbIngestRuns,
  kbRateGroups,
  kbWageDeterminations,
  kbWdCounties,
  kbWdModifications,
} from '../schema';
import {
  assertIdentityMatches,
  assertIndexPlausible,
  assertParseCoverage,
  assertRatesSane,
} from './gates';
import { PARSER_VERSION, looksLikeDetermination, parseDetermination } from './parser';
import { publicDeterminationUrl } from './sam-endpoints';
import {
  toIsoDay,
  type SamAdapter,
  type SamIndexRecord,
} from './sam';

export type IngestTrigger = 'pin' | 'public_view' | 'watch' | 'backfill' | 'diff' | 'index' | 'pull';

export type IngestDeterminationResult = {
  status: 'inserted' | 'already_held';
  wdId: string;
  wdNumber: string;
  modificationNumber: number;
  classifications: number;
  rateGroups: number;
  coverage: number;
  supersededWdId?: string;
  supersededFromModification?: number;
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** The county set for a determination, from the INDEX record — SAM's own
 *  numeric codes, which is what a county query needs (the NAME returns zero,
 *  silently: KNOWLEDGE_BASE KB-1). */
function countiesFromIndex(record: SamIndexRecord | undefined): Array<{ code: number; name: string }> {
  return (record?.location?.state?.counties ?? []).map((c) => ({ code: c.code, name: c.value }));
}

/**
 * Ingest ONE `(wd_number, modification_number)`.
 *
 * `indexRecord` is present for the daily diff and absent for an on-demand fetch
 * of a named older revision — the case the offer is built on. When it is
 * absent, the county set is inherited from the newest revision of the same WD
 * number that we already hold, because a superseded revision is reached by
 * number and never by geography, and inventing a county list for it would be
 * inventing data.
 */
export async function ingestDetermination(
  db: Db,
  adapter: SamAdapter,
  input: {
    wdNumber: string;
    revision: number;
    indexRecord?: SamIndexRecord;
    /** Force `is_active`; otherwise derived from the index record or /history. */
    isActive?: boolean;
    trigger?: IngestTrigger;
    now?: Date;
  },
): Promise<IngestDeterminationResult> {
  const now = input.now ?? new Date();
  const wdNumber = input.wdNumber;
  const revision = input.revision;

  const existing = await db
    .select({ id: kbWageDeterminations.id, classifications: sql<number>`0` })
    .from(kbWageDeterminations)
    .where(
      and(
        eq(kbWageDeterminations.wdNumber, wdNumber),
        eq(kbWageDeterminations.modificationNumber, revision),
      ),
    )
    .limit(1);

  if (existing[0]) {
    // Idempotence: seen, so only `last_verified` moves forward. The text and
    // the rates are never re-written (gate G2).
    await db
      .update(kbWageDeterminations)
      .set({ lastVerified: now })
      .where(eq(kbWageDeterminations.id, existing[0].id));
    await db
      .update(kbClassifications)
      .set({ lastVerified: now })
      .where(eq(kbClassifications.wdId, existing[0].id));
    return {
      status: 'already_held',
      wdId: existing[0].id,
      wdNumber,
      modificationNumber: revision,
      classifications: 0,
      rateGroups: 0,
      coverage: 1,
    };
  }

  const fetched = await adapter.fetchDetermination(wdNumber, revision);

  // V5 — a document that is empty or does not carry the header is REJECTED,
  // not stored. There is no partial determination.
  if (!looksLikeDetermination(fetched.document)) {
    throw new Error(
      `[V5] ${wdNumber}/${revision}: the document is empty or does not contain "General Decision Number:"`,
    );
  }

  const parsed = parseDetermination(fetched.document);
  assertIdentityMatches(wdNumber, parsed.wdNumber); // V6
  assertParseCoverage(wdNumber, parsed.coverage, parsed.classifications.length, parsed.naiveRateLines); // G3
  assertRatesSane(wdNumber, parsed.classifications); // G4

  const sourceUrl = adapter.determinationSourceUrl(wdNumber, revision);
  const publicUrl = publicDeterminationUrl(wdNumber, revision);
  const stateCode = (
    input.indexRecord?.location?.state?.code ??
    wdNumber.slice(0, 2)
  ).toUpperCase();
  const publicationDate = toIsoDay(input.indexRecord?.publishDate ?? fetched.publishDate) ||
    parsed.publicationDate ||
    now.toISOString().slice(0, 10);
  const constructionTypes =
    input.indexRecord?.constructionTypes ??
    (Array.isArray(fetched.constructionType)
      ? fetched.constructionType
      : fetched.constructionType
        ? [fetched.constructionType]
        : parsed.constructionTypes);

  const isActive =
    input.isActive ?? (input.indexRecord ? input.indexRecord.isActive : (fetched.active ?? false));

  const counties = input.indexRecord
    ? countiesFromIndex(input.indexRecord)
    : await inheritCounties(db, wdNumber);

  const wdId = newId('wd');

  const result = await withTx(db, async (tx) => {
    await tx.insert(kbWageDeterminations).values({
      id: wdId,
      wdNumber,
      modificationNumber: revision,
      stateCode,
      constructionTypes,
      publicationDate,
      isActive,
      isStandard: input.indexRecord?.isStandard ?? fetched.standard ?? false,
      documentText: fetched.document,
      documentSha256: sha256(fetched.document),
      parserVersion: PARSER_VERSION,
      sourceUrl,
      publicUrl,
      fetchedAt: now,
      lastVerified: now,
    });

    if (counties.length > 0) {
      await tx
        .insert(kbWdCounties)
        .values(
          counties.map((c) => ({
            wdId,
            stateCode,
            samCountyCode: c.code,
            countyName: c.name,
          })),
        )
        .onConflictDoNothing();
    }

    const groupIds = new Map<string, string>();
    if (parsed.rateGroups.length > 0) {
      const rows = parsed.rateGroups.map((g) => {
        const id = newId('rg');
        groupIds.set(`${g.identifier}@${g.effectiveDate}`, id);
        return {
          id,
          wdId,
          identifier: g.identifier,
          kind: g.kind,
          effectiveDate: g.effectiveDate,
        };
      });
      // A determination may list the same local twice with different effective
      // dates (TX20260253 has IRON0084-012 at 2017-06-01 and 2024-06-01). The
      // unique index is on (wd_id, identifier, effective_date); the duplicate
      // that is a true duplicate is dropped here rather than failing the run.
      await tx.insert(kbRateGroups).values(rows).onConflictDoNothing();
    }

    if (parsed.classifications.length > 0) {
      await tx.insert(kbClassifications).values(
        parsed.classifications.map((c) => ({
          id: newId('cls'),
          wdId,
          rateGroupId:
            groupIds.get(`${c.rateGroupIdentifier}@${c.rateGroupEffectiveDate}`) ??
            (groupIds.values().next().value as string),
          lineNo: c.lineNo,
          classificationLabel: c.classificationLabel,
          searchLabel: c.searchLabel,
          tradeFamily: c.tradeFamily,
          baseRate: c.baseRate.toFixed(2),
          fringeRate: c.fringeRate.toFixed(2),
          qualifier: c.qualifier,
          footnoteText: c.footnoteText,
          // Provenance, on every single row. Gate G1.
          wdNumber,
          modificationNumber: revision,
          publicationDate,
          sourceUrl,
          lastVerified: now,
        })),
      );
    }

    // The modification table printed in the document itself is a free, offline
    // source of history — recorded so a timeline can render even before
    // `kb.fetch_history` has run. `/history` remains the authority and
    // overwrites these rows with its own `active` flag.
    for (const mod of parsed.modifications) {
      await tx
        .insert(kbWdModifications)
        .values({
          wdNumber,
          modificationNumber: mod.modificationNumber,
          publicationDate: mod.publicationDate,
          active: mod.modificationNumber === revision ? isActive : false,
          textHeld: mod.modificationNumber === revision,
          historySourceUrl: sourceUrl,
          historyFetchedAt: now,
        })
        .onConflictDoUpdate({
          target: [kbWdModifications.wdNumber, kbWdModifications.modificationNumber],
          set: {
            textHeld: sql`${kbWdModifications.textHeld} OR ${mod.modificationNumber === revision}`,
          },
        });
    }

    // Supersession. ONLY a newer active revision demotes an older one; fetching
    // mod 0 after mod 1 must leave mod 1 active (V10).
    let supersededWdId: string | undefined;
    let supersededFromModification: number | undefined;
    if (isActive) {
      const older = await tx
        .select({
          id: kbWageDeterminations.id,
          modificationNumber: kbWageDeterminations.modificationNumber,
        })
        .from(kbWageDeterminations)
        .where(
          and(
            eq(kbWageDeterminations.wdNumber, wdNumber),
            eq(kbWageDeterminations.isActive, true),
            sql`${kbWageDeterminations.modificationNumber} < ${revision}`,
          ),
        );
      for (const row of older) {
        await tx
          .update(kbWageDeterminations)
          // `document_text` and every rate are untouched: only the pointer and
          // the flag move.
          .set({ isActive: false, supersededById: wdId })
          .where(eq(kbWageDeterminations.id, row.id));
        await tx
          .update(kbWdModifications)
          .set({ active: false })
          .where(
            and(
              eq(kbWdModifications.wdNumber, wdNumber),
              eq(kbWdModifications.modificationNumber, row.modificationNumber),
            ),
          );
        supersededWdId = row.id;
        supersededFromModification = row.modificationNumber;
      }
    }

    return { supersededWdId, supersededFromModification };
  });

  return {
    status: 'inserted',
    wdId,
    wdNumber,
    modificationNumber: revision,
    classifications: parsed.classifications.length,
    rateGroups: parsed.rateGroups.length,
    coverage: parsed.coverage,
    ...(result.supersededWdId ? { supersededWdId: result.supersededWdId } : {}),
    ...(result.supersededFromModification !== undefined
      ? { supersededFromModification: result.supersededFromModification }
      : {}),
  };
}

/** The county set of the newest revision we hold for this WD number. Used when
 *  a superseded revision is fetched on demand and there is no index record. */
async function inheritCounties(
  db: Db,
  wdNumber: string,
): Promise<Array<{ code: number; name: string }>> {
  const rows = await db
    .select({
      code: kbWdCounties.samCountyCode,
      name: kbWdCounties.countyName,
      mod: kbWageDeterminations.modificationNumber,
    })
    .from(kbWdCounties)
    .innerJoin(kbWageDeterminations, eq(kbWdCounties.wdId, kbWageDeterminations.id))
    .where(eq(kbWageDeterminations.wdNumber, wdNumber));
  if (rows.length === 0) return [];
  const newest = Math.max(...rows.map((r) => r.mod));
  return rows.filter((r) => r.mod === newest).map((r) => ({ code: r.code, name: r.name }));
}

/**
 * `/history` → one `kb_wd_modifications` row per revision.
 *
 * V11: history is METADATA. This function upserts `kb_wd_modifications` and
 * touches NOTHING in `kb_wage_determinations` — determinations stay append-only.
 * It is called eagerly whenever anything touches a WD number, because one small
 * request means a timeline can always be drawn; the 17 KB text of an old
 * revision is fetched lazily and only when someone asks for it (V12).
 */
export async function fetchHistory(
  db: Db,
  adapter: SamAdapter,
  wdNumber: string,
  now = new Date(),
): Promise<{ revisions: number; heldRevisions: number[] }> {
  const revisions = await adapter.fetchHistory(wdNumber);
  const held = await db
    .select({ modificationNumber: kbWageDeterminations.modificationNumber })
    .from(kbWageDeterminations)
    .where(eq(kbWageDeterminations.wdNumber, wdNumber));
  const heldSet = new Set(held.map((h) => h.modificationNumber));
  const sourceUrl = adapter.historySourceUrl(wdNumber);

  for (const revision of revisions) {
    await db
      .insert(kbWdModifications)
      .values({
        wdNumber,
        modificationNumber: revision.revisionNumber,
        publicationDate: toIsoDay(revision.publishDate),
        active: revision.active,
        textHeld: heldSet.has(revision.revisionNumber),
        historySourceUrl: sourceUrl,
        historyFetchedAt: now,
      })
      .onConflictDoUpdate({
        target: [kbWdModifications.wdNumber, kbWdModifications.modificationNumber],
        set: {
          publicationDate: toIsoDay(revision.publishDate),
          active: revision.active,
          textHeld: heldSet.has(revision.revisionNumber),
          historySourceUrl: sourceUrl,
          historyFetchedAt: now,
        },
      });
  }

  return {
    revisions: revisions.length,
    heldRevisions: [...heldSet].sort((a, b) => a - b),
  };
}

/** SAM's county dictionary for a state. The lookup that turns "Harris" into
 *  14885, without which `county=` silently returns nothing. */
export async function ingestCounties(
  db: Db,
  adapter: SamAdapter,
  stateCode: string,
  now = new Date(),
): Promise<number> {
  const counties = await adapter.fetchCounties(stateCode);
  const sourceUrl = adapter.countySourceUrl(stateCode);
  const state = stateCode.toUpperCase();
  for (const county of counties) {
    await db
      .insert(kbCounties)
      .values({
        stateCode: state,
        samCountyCode: county.code,
        countyName: county.name,
        slug: slugify(county.name),
        sourceUrl,
        lastVerified: now,
      })
      .onConflictDoUpdate({
        // Keyed on (state, code, NAME): SAM's codes are not FIPS and are not
        // unique — Alaska reuses 17987 for Aleutians East and Aleutians West.
        target: [kbCounties.stateCode, kbCounties.samCountyCode, kbCounties.countyName],
        set: { slug: slugify(county.name), sourceUrl, lastVerified: now },
      });
  }
  return counties.length;
}

export type IndexRefreshResult = {
  runId: string;
  seen: number;
  new: Array<{ wdNumber: string; modificationNumber: number }>;
  reverified: number;
  deactivated: number;
  status: 'ok' | 'aborted_on_gate';
  failureReason?: string;
};

/**
 * The daily index pass: pre-flight → index → diff. It NEVER fetches
 * determination text itself — Vercel's function timeout makes that impossible
 * for 4,235 records, so the diff enqueues and the drain consumes.
 */
export async function refreshIndex(
  db: Db,
  adapter: SamAdapter,
  options: {
    state?: string;
    pageSize?: number;
    maxPages?: number;
    now?: Date;
    /** Called for each new pair; the caller enqueues (or, in the CLI, fetches). */
    onNewPair?: (pair: { wdNumber: string; modificationNumber: number; record: SamIndexRecord }) => Promise<void>;
  } = {},
): Promise<IndexRefreshResult> {
  const now = options.now ?? new Date();
  const runId = newId('run');
  await db.insert(kbIngestRuns).values({
    id: runId,
    kind: options.state ? 'delta' : 'full',
    status: 'running',
    startedAt: now,
  });

  try {
    // --- PRE-FLIGHT (gate G10) — aborts the run, writes nothing ------------
    const probe = await adapter.fetchIndexPage({ page: 0, size: 1, ...(options.state ? { state: options.state } : {}) });
    const previous = await lastSuccessfulIndexCount(db, options.state ? 'delta' : 'full');
    assertIndexPlausible(probe.totalElements, previous);

    // --- INDEX ------------------------------------------------------------
    const pageSize = options.pageSize ?? 2000;
    const maxPages = options.maxPages ?? 10;
    const records: SamIndexRecord[] = [];
    for (let page = 0; page < maxPages; page += 1) {
      const result = await adapter.fetchIndexPage({
        page,
        size: pageSize,
        ...(options.state ? { state: options.state } : {}),
      });
      records.push(...result.records);
      if (records.length >= result.totalElements || result.records.length === 0) break;
    }

    // --- DIFF against what we hold ---------------------------------------
    const held = await db
      .select({
        id: kbWageDeterminations.id,
        wdNumber: kbWageDeterminations.wdNumber,
        modificationNumber: kbWageDeterminations.modificationNumber,
        isActive: kbWageDeterminations.isActive,
      })
      .from(kbWageDeterminations);
    const heldKeys = new Map(held.map((h) => [`${h.wdNumber}:${h.modificationNumber}`, h]));

    const seenIds: string[] = [];
    const newPairs: Array<{ wdNumber: string; modificationNumber: number }> = [];
    const indexKeys = new Set<string>();

    for (const record of records) {
      const key = `${record.fullReferenceNumber}:${record.revisionNumber}`;
      indexKeys.add(key);
      const existing = heldKeys.get(key);
      if (existing) {
        seenIds.push(existing.id);
        continue;
      }
      newPairs.push({
        wdNumber: record.fullReferenceNumber,
        modificationNumber: record.revisionNumber,
      });
      await options.onNewPair?.({
        wdNumber: record.fullReferenceNumber,
        modificationNumber: record.revisionNumber,
        record,
      });
    }

    // Seen → `last_verified` moves forward, in one batch UPDATE.
    if (seenIds.length > 0) {
      for (let i = 0; i < seenIds.length; i += 500) {
        await db
          .update(kbWageDeterminations)
          .set({ lastVerified: now })
          .where(inArray(kbWageDeterminations.id, seenIds.slice(i, i + 500)));
      }
    }

    // Gone from the active index → `is_active = false`. Scoped to the state
    // when the run was scoped, so a TX pull cannot deactivate California.
    let deactivated = 0;
    for (const row of held) {
      if (!row.isActive) continue;
      if (indexKeys.has(`${row.wdNumber}:${row.modificationNumber}`)) continue;
      if (options.state && !row.wdNumber.startsWith(options.state.toUpperCase())) continue;
      await db
        .update(kbWageDeterminations)
        .set({ isActive: false })
        .where(eq(kbWageDeterminations.id, row.id));
      deactivated += 1;
    }

    await db
      .update(kbIngestRuns)
      .set({
        finishedAt: new Date(),
        status: 'ok',
        indexRecordsSeen: records.length,
        determinationsNew: newPairs.length,
        determinationsChanged: deactivated,
      })
      .where(eq(kbIngestRuns.id, runId));

    return {
      runId,
      seen: records.length,
      new: newPairs,
      reverified: seenIds.length,
      deactivated,
      status: 'ok',
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await db
      .update(kbIngestRuns)
      .set({ finishedAt: new Date(), status: 'aborted_on_gate', failureReason: reason })
      .where(eq(kbIngestRuns.id, runId));
    return {
      runId,
      seen: 0,
      new: [],
      reverified: 0,
      deactivated: 0,
      status: 'aborted_on_gate',
      failureReason: reason,
    };
  }
}

async function lastSuccessfulIndexCount(db: Db, kind: string): Promise<number | null> {
  const rows = await db
    .select({ seen: kbIngestRuns.indexRecordsSeen })
    .from(kbIngestRuns)
    .where(and(eq(kbIngestRuns.status, 'ok'), eq(kbIngestRuns.kind, kind)))
    .orderBy(sql`${kbIngestRuns.startedAt} desc`)
    .limit(1);
  return rows[0]?.seen ?? null;
}
