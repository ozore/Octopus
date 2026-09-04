/**
 * THE LANDING PAGE'S DATA PATH — our own corpus, never sam.gov at request time.
 *
 * `LANDING_SPEC.md` §5.2 is explicit and this module is the shape of it:
 *
 *   · **Live:** the ingested corpus through `@/lib/kb` — the same queries the
 *     public result page runs (`findDeterminations`, `searchClassifications`,
 *     `getModificationHistory`). The browser never calls a third party, and
 *     neither does the server while rendering this page.
 *   · **No snapshot fallback** (finding M16, decision D8). "Unreachable" here
 *     does not mean SAM.gov is down, it means WE are down — and serving a rate
 *     whose current source we cannot confirm, during our own outage, is exactly
 *     the fact pattern the provenance guarantee exists for. When the corpus is
 *     empty the page shows the honest error, the SAM.gov link, and **no rate**.
 *
 * The three extra queries at the bottom (the example determination, the
 * modification divergence, the last ingest run) read the corpus tables
 * directly rather than through `@/lib/kb`, because `BUILD.md` §3 freezes that
 * barrel and a landing page is not a reason to unfreeze it. They are listed in
 * `REQUESTS.md` for the orchestrator to move up into `lib/kb/lookup.ts`.
 */

import { and, asc, desc, eq, sql } from 'drizzle-orm';

import type { Provenance } from '@/components/provenance';
import {
  CONSTRUCTION_TYPES,
  corpusHealth,
  findCountyBySlug,
  findDeterminations,
  getDetermination,
  getModificationHistory,
  listCounties,
  listStates,
  searchClassifications,
  type ClassificationRow,
  type CorpusHealth,
  type DeterminationCandidate,
} from '@/lib/kb';
import { kbIngestRuns, kbWageDeterminations, kbWdModifications } from '@/lib/schema';
import type { Db } from '@octopus/platform/db';

import type { TimelineDivergence, TimelineModification } from './visuals/timeline';

/** How many rate lines V1 shows before it points at the full determination.
 *  The card is proof, not a catalogue; the catalogue has its own page. */
export const DEMO_ROW_LIMIT = 8;

export type DemoSelection = {
  state?: string;
  county?: string;
  type?: string;
  modification?: number;
};

export type DemoDeterminationView = {
  kind: 'determination';
  /** `example` on first paint, `lookup` once the visitor has chosen. */
  origin: 'example' | 'lookup';
  determination: DeterminationCandidate;
  provenance: Provenance;
  rows: ClassificationRow[];
  total: number;
  scope: string;
  modifications: TimelineModification[];
  pinned: number;
  current: number;
  divergence: TimelineDivergence | null;
  resultHref: string;
};

export type DemoResult =
  | DemoDeterminationView
  | { kind: 'candidates'; candidates: DeterminationCandidate[]; countyLabel: string }
  | { kind: 'empty'; countyLabel: string; constructionType: string | undefined; href: string }
  /** WL-00 V5: over the budget is a plain, honest message with the SAM.gov
   *  link and NO signup prompt — a wall at the moment of friction would
   *  falsify the page's own argument that the rate is free. */
  | { kind: 'rate_limited'; retryAfterMinutes: number }
  | { kind: 'unavailable' };

export type LandingData = {
  states: Array<{ stateCode: string }>;
  counties: Array<{ slug: string; countyName: string }>;
  selection: DemoSelection;
  result: DemoResult;
  health: CorpusHealth;
  lastRefresh: { at: string | null; status: string | null };
};

function provenanceOf(d: DeterminationCandidate, stale: boolean, newer?: TimelineModification | null): Provenance {
  return {
    wdNumber: d.wdNumber,
    modificationNumber: d.modificationNumber,
    publicationDate: d.publicationDate,
    lastVerified: d.lastVerified,
    publicUrl: d.publicUrl,
    stale,
    ...(newer
      ? {
          newerModification: {
            modificationNumber: newer.modificationNumber,
            publicationDate: newer.publicationDate,
          },
        }
      : {}),
  };
}

function scopeOf(d: DeterminationCandidate): string {
  const counties =
    d.countyCount === 0
      ? 'Statewide'
      : d.countyCount === 1
        ? `${d.countyNames[0]} County`
        : `${d.countyCount} counties`;
  return `${counties} · ${d.constructionTypes.join(', ')} construction`;
}

/**
 * The determination the page ships with when nobody has chosen one yet
 * (§5.3: "pre-filled on first paint so the widget is never an empty box").
 *
 * It is chosen by the corpus, not hard-coded: the determination with the most
 * modifications on record, because that is the one that can actually draw V2.
 * §6 V2's rule — "The build must select a shipped example WD with at least
 * three modifications; if none is found, the diagram ships with two and the
 * caption is honest about it" — is therefore satisfied by a query rather than
 * by a constant that would rot the first time the corpus grew.
 */
async function pickExampleWdNumber(db: Db): Promise<string | null> {
  const [withHistory] = await db
    .select({ wdNumber: kbWdModifications.wdNumber, mods: sql<number>`count(*)::int` })
    .from(kbWdModifications)
    .innerJoin(
      kbWageDeterminations,
      and(
        eq(kbWageDeterminations.wdNumber, kbWdModifications.wdNumber),
        eq(kbWageDeterminations.isActive, true),
      ),
    )
    .groupBy(kbWdModifications.wdNumber)
    .orderBy(desc(sql`count(*)`), asc(kbWdModifications.wdNumber))
    .limit(1);
  if (withHistory?.wdNumber) return withHistory.wdNumber;

  const [any] = await db
    .select({ wdNumber: kbWageDeterminations.wdNumber })
    .from(kbWageDeterminations)
    .where(eq(kbWageDeterminations.isActive, true))
    .orderBy(asc(kbWageDeterminations.wdNumber))
    .limit(1);
  return any?.wdNumber ?? null;
}

/**
 * What actually moved between two modifications of one determination —
 * computed from the rows we hold for each, never estimated.
 *
 * A classification is matched on its label, which is the only stable key
 * across modifications: `kb_classifications` is keyed on `(wd_id, line_no)`
 * because labels repeat WITHIN a determination, and a line number is not
 * comparable ACROSS two of them.
 */
export async function divergenceBetween(
  db: Db,
  olderWdId: string,
  newerWdId: string,
): Promise<TimelineDivergence> {
  const [older, newer] = await Promise.all([
    searchClassifications(db, olderWdId, { limit: 1000 }),
    searchClassifications(db, newerWdId, { limit: 1000 }),
  ]);
  const key = (r: ClassificationRow) => `${r.classificationLabel}::${r.rateGroupIdentifier}`;
  const before = new Map(older.rows.map((r) => [key(r), r]));
  const after = new Map(newer.rows.map((r) => [key(r), r]));

  let ratesMoved = 0;
  let added = 0;
  for (const [k, row] of after) {
    const was = before.get(k);
    if (!was) {
      added += 1;
      continue;
    }
    if (Number(was.baseRate) !== Number(row.baseRate) || Number(was.fringeRate) !== Number(row.fringeRate)) {
      ratesMoved += 1;
    }
  }
  let removed = 0;
  for (const k of before.keys()) if (!after.has(k)) removed += 1;

  return { ratesMoved, added, removed };
}

async function viewFor(
  db: Db,
  determination: DeterminationCandidate,
  origin: 'example' | 'lookup',
  requestedModification: number | undefined,
  stale: boolean,
): Promise<DemoDeterminationView> {
  const history = await getModificationHistory(db, determination.wdNumber);
  const modifications: TimelineModification[] = history.map((m) => ({
    modificationNumber: m.modificationNumber,
    publicationDate: m.publicationDate,
    active: m.active,
  }));

  const activeModification = determination.modificationNumber;
  let shown = determination;
  let newer: TimelineModification | null = null;

  // The modification a contract locked is READ, never guessed: an explicit
  // request for an earlier one renders THAT one, with the newer one named
  // permanently beside it (WL-02 V3b, 29 CFR 1.6).
  if (requestedModification !== undefined && requestedModification !== activeModification) {
    const resolved = await getDetermination(db, determination.wdNumber, requestedModification);
    if (resolved.resolution === 'superseded') {
      shown = resolved.determination;
      newer =
        modifications.find((m) => m.modificationNumber === resolved.activeModification) ?? null;
    }
  }

  const { rows, total } = await searchClassifications(db, shown.wdId, { limit: DEMO_ROW_LIMIT });

  const oldest = modifications.reduce<TimelineModification | null>(
    (acc, m) => (acc === null || m.modificationNumber < acc.modificationNumber ? m : acc),
    null,
  );
  const pinned = shown.modificationNumber;
  const current = activeModification;

  let divergence: TimelineDivergence | null = null;
  if (oldest && oldest.modificationNumber !== current) {
    let older: DeterminationCandidate | null = null;
    if (oldest.modificationNumber === shown.modificationNumber) {
      older = shown;
    } else {
      const resolved = await getDetermination(db, determination.wdNumber, oldest.modificationNumber);
      if (resolved.resolution === 'superseded') older = resolved.determination;
      else if (resolved.resolution === 'active') older = resolved.determination;
    }
    // Only when we hold BOTH modifications' rows. A diagram is allowed to say
    // nothing; it is never allowed to estimate.
    if (older) divergence = await divergenceBetween(db, older.wdId, determination.wdId);
  }

  return {
    kind: 'determination',
    origin,
    determination: shown,
    provenance: provenanceOf(shown, stale, newer),
    rows,
    total,
    scope: scopeOf(shown),
    modifications,
    pinned,
    current,
    divergence,
    resultHref: `/wd/${shown.wdNumber}${shown.modificationNumber === current ? '' : `/${shown.modificationNumber}`}`,
  };
}

/** The one entry point the page calls. */
export async function loadLandingData(db: Db, selection: DemoSelection): Promise<LandingData> {
  const [states, health, lastRefresh] = await Promise.all([
    listStates(db),
    corpusHealth(db),
    lastIngestRun(db),
  ]);
  const counties = selection.state ? await listCounties(db, selection.state) : [];

  if (health.activeDeterminations === 0) {
    return { states, counties, selection, result: { kind: 'unavailable' }, health, lastRefresh };
  }

  const constructionType =
    selection.type && selection.type !== 'all'
      ? CONSTRUCTION_TYPES.find((t) => t.toLowerCase() === selection.type?.toLowerCase())
      : undefined;

  if (selection.state && selection.county) {
    const county = await findCountyBySlug(db, selection.state, selection.county);
    if (county) {
      const { candidates } = await findDeterminations(db, {
        stateCode: selection.state,
        samCountyCode: county.samCountyCode,
        ...(constructionType ? { constructionType } : {}),
      });
      const countyLabel = `${county.countyName} County, ${selection.state.toUpperCase()}`;

      if (candidates.length === 0) {
        return {
          states,
          counties,
          selection,
          result: {
            kind: 'empty',
            countyLabel,
            constructionType,
            href: `/lookup/${selection.state.toLowerCase()}/${selection.county}/all`,
          },
          health,
          lastRefresh,
        };
      }
      if (candidates.length > 1) {
        return {
          states,
          counties,
          selection,
          result: { kind: 'candidates', candidates, countyLabel },
          health,
          lastRefresh,
        };
      }
      const only = candidates[0] as DeterminationCandidate;
      return {
        states,
        counties,
        selection,
        result: await viewFor(db, only, 'lookup', selection.modification, health.stale),
        health,
        lastRefresh,
      };
    }
  }

  const exampleNumber = await pickExampleWdNumber(db);
  if (!exampleNumber) {
    return { states, counties, selection, result: { kind: 'unavailable' }, health, lastRefresh };
  }
  const example = await getDetermination(db, exampleNumber);
  if (example.resolution !== 'active') {
    return { states, counties, selection, result: { kind: 'unavailable' }, health, lastRefresh };
  }
  return {
    states,
    counties,
    selection,
    result: await viewFor(db, example.determination, 'example', selection.modification, health.stale),
    health,
    lastRefresh,
  };
}

/**
 * The footer's data-provenance line, wired to `kb_ingest_runs` (§10).
 * **If the last run failed, this says so.** A stale timestamp shown honestly is
 * worth more than a fresh one that is wrong.
 */
export async function lastIngestRun(db: Db): Promise<{ at: string | null; status: string | null }> {
  const [row] = await db
    .select({
      finishedAt: kbIngestRuns.finishedAt,
      startedAt: kbIngestRuns.startedAt,
      status: kbIngestRuns.status,
    })
    .from(kbIngestRuns)
    .orderBy(desc(kbIngestRuns.startedAt))
    .limit(1);
  if (!row) return { at: null, status: null };
  const at = row.finishedAt ?? row.startedAt;
  return { at: at ? new Date(at).toISOString() : null, status: row.status };
}
