/**
 * THE ONLY MODULE WL-00, WL-02, WL-03 AND WL-04 TOUCH.
 *
 * Everything here reads `kb_*` — **our own database, never the network**. That
 * sentence is a promise the product makes on a public page and refunds on
 * (OFFER §5.2), so the seam has to be one module and the module has to say so.
 * The two exceptions are explicit and are the whole of finding B4: a revision
 * whose TEXT we do not hold, and a WD number whose HISTORY we have never
 * pulled, both enqueue a background fetch and answer `fetching` — they never
 * substitute the active modification's rates under an older heading.
 *
 * Two shapes the callers must not paper over:
 *
 *  - **F3.** 12.17% of (state, county, construction type) combinations map to
 *    more than one active determination. `findDeterminations` therefore returns
 *    CANDIDATES and an `ambiguous` flag, never a best guess. There is no
 *    "most likely" heuristic anywhere in this codebase, and adding one would be
 *    wrong in a way the user cannot detect.
 *  - **A superseded revision resolves as readily as an active one.** 29 CFR 1.6
 *    fixes the applicable determination at solicitation or award, so the
 *    modification a contract incorporated governs the job even after DOL
 *    publishes a newer one. `not_found` (refuse — a typo) and `superseded`
 *    (resolve, and name the newer one) are different answers.
 */

import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';

import { enqueue } from '@octopus/platform/jobs';
import type { Db } from '@octopus/platform/db';

import {
  kbClassifications,
  kbCounties,
  kbRateGroups,
  kbWageDeterminations,
  kbWdCounties,
  kbWdModifications,
} from '../schema';
import { CORPUS_STALE_DAYS } from './gates';
import { KB_JOB_KINDS } from './job-kinds';
import { normaliseWdNumber } from './sam';

export const CONSTRUCTION_TYPES = ['Building', 'Residential', 'Highway', 'Heavy'] as const;
export type ConstructionType = (typeof CONSTRUCTION_TYPES)[number];

/** One line of plain DOL description each, because choosing "Building" for a
 *  water-line job is the most common way to end up on the wrong determination
 *  — and it produces a plausible-looking, entirely wrong payroll. */
export const CONSTRUCTION_TYPE_DESCRIPTIONS: Record<ConstructionType, string> = {
  Building: 'Sheltered enclosures with walk-in access, and the utilities and equipment inside them.',
  Residential: 'Single-family houses and apartment buildings of no more than four storeys.',
  Highway: 'Roads, streets, runways, parking areas and alleys not incidental to another project.',
  Heavy: 'Everything else: water and sewer lines, dams, dredging, flood control, pipelines.',
};

export type DeterminationCandidate = {
  wdId: string;
  wdNumber: string;
  modificationNumber: number;
  publicationDate: string;
  constructionTypes: string[];
  isActive: boolean;
  countyNames: string[];
  countyCount: number;
  classificationCount: number;
  publicUrl: string;
  sourceUrl: string;
  lastVerified: Date;
};

export type DeterminationResolution =
  | { resolution: 'active'; determination: DeterminationCandidate }
  | {
      resolution: 'superseded';
      determination: DeterminationCandidate;
      activeModification: number;
      activePublicationDate: string;
    }
  /** The revision exists (history knows it) but we do not hold its text yet.
   *  A fetch has been enqueued; the page says so and resolves. */
  | { resolution: 'fetching'; wdNumber: string; modificationNumber: number }
  | { resolution: 'not_found'; wdNumber: string; modificationNumber?: number; knownModifications: number[] };

export async function listStates(db: Db): Promise<Array<{ stateCode: string; countyCount: number }>> {
  const rows = await db
    .select({
      stateCode: kbCounties.stateCode,
      countyCount: sql<number>`count(*)::int`,
    })
    .from(kbCounties)
    .groupBy(kbCounties.stateCode)
    .orderBy(asc(kbCounties.stateCode));
  return rows.map((r) => ({ stateCode: r.stateCode, countyCount: Number(r.countyCount) }));
}

export async function listCounties(
  db: Db,
  stateCode: string,
): Promise<Array<{ samCountyCode: number; countyName: string; slug: string }>> {
  return db
    .select({
      samCountyCode: kbCounties.samCountyCode,
      countyName: kbCounties.countyName,
      slug: kbCounties.slug,
    })
    .from(kbCounties)
    .where(eq(kbCounties.stateCode, stateCode.toUpperCase()))
    .orderBy(asc(kbCounties.countyName));
}

export async function findCountyBySlug(
  db: Db,
  stateCode: string,
  slug: string,
): Promise<{ samCountyCode: number; countyName: string; slug: string } | undefined> {
  const rows = await db
    .select({
      samCountyCode: kbCounties.samCountyCode,
      countyName: kbCounties.countyName,
      slug: kbCounties.slug,
    })
    .from(kbCounties)
    .where(and(eq(kbCounties.stateCode, stateCode.toUpperCase()), eq(kbCounties.slug, slug)))
    .limit(1);
  return rows[0];
}

async function decorate(
  db: Db,
  rows: Array<{
    id: string;
    wdNumber: string;
    modificationNumber: number;
    publicationDate: string;
    constructionTypes: string[];
    isActive: boolean;
    publicUrl: string;
    sourceUrl: string;
    lastVerified: Date;
  }>,
): Promise<DeterminationCandidate[]> {
  const out: DeterminationCandidate[] = [];
  for (const row of rows) {
    const counties = await db
      .select({ countyName: kbWdCounties.countyName })
      .from(kbWdCounties)
      .where(eq(kbWdCounties.wdId, row.id))
      .orderBy(asc(kbWdCounties.countyName));
    const [count] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(kbClassifications)
      .where(eq(kbClassifications.wdId, row.id));
    out.push({
      wdId: row.id,
      wdNumber: row.wdNumber,
      modificationNumber: row.modificationNumber,
      publicationDate: row.publicationDate,
      constructionTypes: row.constructionTypes,
      isActive: row.isActive,
      countyNames: counties.map((c) => c.countyName),
      countyCount: counties.length,
      classificationCount: Number(count?.value ?? 0),
      publicUrl: row.publicUrl,
      sourceUrl: row.sourceUrl,
      lastVerified: row.lastVerified,
    });
  }
  return out;
}

const CANDIDATE_COLUMNS = {
  id: kbWageDeterminations.id,
  wdNumber: kbWageDeterminations.wdNumber,
  modificationNumber: kbWageDeterminations.modificationNumber,
  publicationDate: kbWageDeterminations.publicationDate,
  constructionTypes: kbWageDeterminations.constructionTypes,
  isActive: kbWageDeterminations.isActive,
  publicUrl: kbWageDeterminations.publicUrl,
  sourceUrl: kbWageDeterminations.sourceUrl,
  lastVerified: kbWageDeterminations.lastVerified,
};

/**
 * Geography NARROWS; it does not decide. Returns every active determination
 * covering the county, filtered client-side on construction type because SAM's
 * own `constructionType=` parameter is ignored by the index and the array lives
 * on our row anyway.
 */
export async function findDeterminations(
  db: Db,
  input: { stateCode: string; samCountyCode: number; constructionType?: string },
): Promise<{ candidates: DeterminationCandidate[]; ambiguous: boolean }> {
  const rows = await db
    .selectDistinct(CANDIDATE_COLUMNS)
    .from(kbWageDeterminations)
    .innerJoin(kbWdCounties, eq(kbWdCounties.wdId, kbWageDeterminations.id))
    .where(
      and(
        eq(kbWageDeterminations.isActive, true),
        eq(kbWdCounties.stateCode, input.stateCode.toUpperCase()),
        eq(kbWdCounties.samCountyCode, input.samCountyCode),
      ),
    )
    .orderBy(asc(kbWageDeterminations.wdNumber));

  const filtered = input.constructionType
    ? rows.filter((r) => r.constructionTypes.includes(input.constructionType as string))
    : rows;

  const candidates = await decorate(db, filtered);
  return { candidates, ambiguous: candidates.length > 1 };
}

/**
 * WD-number alias resolution (WL-02 V8). SAM lists `TX260253`, `TX26253`,
 * `TX2026253` and `TX0253` as aliases of `TX20260253`, and **a contract may
 * print any of them.** This is not a nicety: the contract in Rosa's hand is the
 * authority, and a lookup that only accepts our canonical form makes her
 * retype something she cannot verify.
 */
export function aliasCandidates(input: string): { exact: string | null; likePattern: string | null } {
  const normalised = normaliseWdNumber(input);
  const match = /^([A-Z]{2})([0-9]{1,9})$/.exec(normalised);
  if (!match) return { exact: null, likePattern: null };
  const state = match[1] as string;
  const digits = match[2] as string;

  if (digits.length >= 8) return { exact: `${state}${digits.slice(0, 8)}`, likePattern: null };

  if (digits.length >= 5 && /^(19|20)/.test(digits)) {
    const year = digits.slice(0, 4);
    const serial = digits.slice(4).padStart(4, '0');
    return { exact: `${state}${year}${serial}`, likePattern: null };
  }
  if (digits.length >= 5) {
    const year = `20${digits.slice(0, 2)}`;
    const serial = digits.slice(2).padStart(4, '0');
    return { exact: `${state}${year}${serial}`, likePattern: null };
  }
  // Serial only (`TX0253`, `TX253`): the year is unknown, so match on the
  // shape. Ambiguity is resolved by the corpus, not by a guess.
  return { exact: null, likePattern: `${state}____${digits.padStart(4, '0')}` };
}

export async function getModificationHistory(
  db: Db,
  wdNumber: string,
): Promise<Array<{ modificationNumber: number; publicationDate: string; active: boolean; textHeld: boolean; historySourceUrl: string }>> {
  return db
    .select({
      modificationNumber: kbWdModifications.modificationNumber,
      publicationDate: kbWdModifications.publicationDate,
      active: kbWdModifications.active,
      textHeld: kbWdModifications.textHeld,
      historySourceUrl: kbWdModifications.historySourceUrl,
    })
    .from(kbWdModifications)
    .where(eq(kbWdModifications.wdNumber, wdNumber))
    .orderBy(desc(kbWdModifications.modificationNumber));
}

/**
 * Resolve a WD number, optionally at an explicit modification.
 *
 *   no modification given          → the ACTIVE modification
 *   modification given, active     → that one
 *   modification given, superseded → THAT ONE, with the newer one named. This
 *                                    is the case the offer is built on; it is
 *                                    not an error and it is never a redirect.
 *   modification given, absent     → not_found. A typo, not a contract.
 */
export async function getDetermination(
  db: Db,
  wdNumberInput: string,
  modificationNumber?: number,
  options: { enqueueMissing?: boolean } = {},
): Promise<DeterminationResolution> {
  const { exact, likePattern } = aliasCandidates(wdNumberInput);
  const where = exact
    ? eq(kbWageDeterminations.wdNumber, exact)
    : likePattern
      ? like(kbWageDeterminations.wdNumber, likePattern)
      : eq(kbWageDeterminations.wdNumber, normaliseWdNumber(wdNumberInput));

  const rows = await db
    .select(CANDIDATE_COLUMNS)
    .from(kbWageDeterminations)
    .where(where)
    .orderBy(desc(kbWageDeterminations.modificationNumber));

  const wdNumber = rows[0]?.wdNumber ?? exact ?? normaliseWdNumber(wdNumberInput);
  const history = await getModificationHistory(db, wdNumber);
  const activeFromHistory = history.find((h) => h.active);

  if (rows.length === 0 && history.length === 0) {
    return { resolution: 'not_found', wdNumber, ...(modificationNumber !== undefined ? { modificationNumber } : {}), knownModifications: [] };
  }

  const activeRow = rows.find((r) => r.isActive) ?? rows[0];

  if (modificationNumber === undefined) {
    if (!activeRow) {
      // We know the document from /history but hold no text at all.
      if (options.enqueueMissing !== false && activeFromHistory) {
        await enqueueDeterminationFetch(db, wdNumber, activeFromHistory.modificationNumber, 'public_view');
      }
      return {
        resolution: 'fetching',
        wdNumber,
        modificationNumber: activeFromHistory?.modificationNumber ?? 0,
      };
    }
    const [determination] = await decorate(db, [activeRow]);
    if (!determination) return { resolution: 'not_found', wdNumber, knownModifications: [] };
    if (determination.isActive) return { resolution: 'active', determination };
    const active = history.find((h) => h.active);
    return {
      resolution: 'superseded',
      determination,
      activeModification: active?.modificationNumber ?? determination.modificationNumber,
      activePublicationDate: active?.publicationDate ?? determination.publicationDate,
    };
  }

  const wanted = rows.find((r) => r.modificationNumber === modificationNumber);
  if (!wanted) {
    const known = history.map((h) => h.modificationNumber);
    if (known.includes(modificationNumber)) {
      // The revision is real; its text is what we lack. Fetch it lazily —
      // 17 KB per revision, and only because someone asked for this one (V12).
      if (options.enqueueMissing !== false) {
        await enqueueDeterminationFetch(db, wdNumber, modificationNumber, 'public_view');
      }
      return { resolution: 'fetching', wdNumber, modificationNumber };
    }
    return { resolution: 'not_found', wdNumber, modificationNumber, knownModifications: known };
  }

  const [determination] = await decorate(db, [wanted]);
  if (!determination) return { resolution: 'not_found', wdNumber, modificationNumber, knownModifications: [] };
  if (determination.isActive) return { resolution: 'active', determination };
  const active = history.find((h) => h.active) ?? { modificationNumber: activeRow?.modificationNumber ?? modificationNumber, publicationDate: determination.publicationDate };
  return {
    resolution: 'superseded',
    determination,
    activeModification: active.modificationNumber,
    activePublicationDate: active.publicationDate,
  };
}

export type ClassificationRow = {
  id: string;
  lineNo: number;
  classificationLabel: string;
  qualifier: string | null;
  footnoteText: string | null;
  tradeFamily: string | null;
  baseRate: string;
  fringeRate: string;
  rateGroupIdentifier: string;
  rateGroupKind: string;
  rateGroupEffectiveDate: string;
  wdNumber: string;
  modificationNumber: number;
  publicationDate: string;
  sourceUrl: string;
  lastVerified: Date;
};

/** Server-side search and pagination: a determination with 300 classifications
 *  is a real case and the count belongs in the heading, not in the browser. */
export async function searchClassifications(
  db: Db,
  wdId: string,
  options: { query?: string; limit?: number; offset?: number } = {},
): Promise<{ rows: ClassificationRow[]; total: number }> {
  const term = options.query?.trim().toLowerCase();
  const normalisedTerm = term ? term.replace(/[^a-z0-9]+/g, ' ').trim() : undefined;
  const filter = normalisedTerm
    ? and(
        eq(kbClassifications.wdId, wdId),
        or(
          like(kbClassifications.searchLabel, `%${normalisedTerm}%`),
          like(sql`lower(${kbClassifications.classificationLabel})`, `%${term}%`),
        ),
      )
    : eq(kbClassifications.wdId, wdId);

  const [total] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(kbClassifications)
    .where(filter);

  const rows = await db
    .select({
      id: kbClassifications.id,
      lineNo: kbClassifications.lineNo,
      classificationLabel: kbClassifications.classificationLabel,
      qualifier: kbClassifications.qualifier,
      footnoteText: kbClassifications.footnoteText,
      tradeFamily: kbClassifications.tradeFamily,
      baseRate: kbClassifications.baseRate,
      fringeRate: kbClassifications.fringeRate,
      rateGroupIdentifier: kbRateGroups.identifier,
      rateGroupKind: kbRateGroups.kind,
      rateGroupEffectiveDate: kbRateGroups.effectiveDate,
      wdNumber: kbClassifications.wdNumber,
      modificationNumber: kbClassifications.modificationNumber,
      publicationDate: kbClassifications.publicationDate,
      sourceUrl: kbClassifications.sourceUrl,
      lastVerified: kbClassifications.lastVerified,
    })
    .from(kbClassifications)
    .innerJoin(kbRateGroups, eq(kbClassifications.rateGroupId, kbRateGroups.id))
    .where(filter)
    .orderBy(asc(kbClassifications.lineNo))
    .limit(options.limit ?? 500)
    .offset(options.offset ?? 0);

  return { rows, total: Number(total?.value ?? 0) };
}

export async function getDeterminationText(db: Db, wdId: string): Promise<string | undefined> {
  const rows = await db
    .select({ documentText: kbWageDeterminations.documentText })
    .from(kbWageDeterminations)
    .where(eq(kbWageDeterminations.id, wdId))
    .limit(1);
  return rows[0]?.documentText;
}

async function enqueueDeterminationFetch(
  db: Db,
  wdNumber: string,
  modificationNumber: number,
  trigger: string,
): Promise<void> {
  await enqueue(db, {
    kind: KB_JOB_KINDS.fetchDetermination,
    payload: { wdNumber, modificationNumber, trigger },
    // `dedupe_key` is what makes the whole pipeline idempotent: enqueuing the
    // same pair twice is a no-op AT THE DATABASE LEVEL, not in application code.
    dedupeKey: `kb.fetch:${wdNumber}:${modificationNumber}`,
  });
}

/** Eager, and cheap: one small request, so a timeline can always be drawn. */
export async function ensureHistoryQueued(db: Db, wdNumber: string): Promise<void> {
  const held = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(kbWdModifications)
    .where(eq(kbWdModifications.wdNumber, wdNumber));
  if (Number(held[0]?.value ?? 0) > 0) return;
  await enqueue(db, {
    kind: KB_JOB_KINDS.fetchHistory,
    payload: { wdNumber },
    dedupeKey: `kb.history:${wdNumber}`,
  });
}

export type CorpusHealth = {
  activeDeterminations: number;
  supersededRevisionsHeld: number;
  determinationsWithHistory: number;
  classifications: number;
  counties: number;
  oldestLastVerified: string | null;
  stale: boolean;
  lastRunStatus: string | null;
  parserVersion: string | null;
};

export async function corpusHealth(db: Db): Promise<CorpusHealth> {
  const [active] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(kbWageDeterminations)
    .where(eq(kbWageDeterminations.isActive, true));
  const [superseded] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(kbWageDeterminations)
    .where(eq(kbWageDeterminations.isActive, false));
  const [withHistory] = await db
    .select({ value: sql<number>`count(distinct ${kbWdModifications.wdNumber})::int` })
    .from(kbWdModifications);
  const [classifications] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(kbClassifications);
  const [counties] = await db.select({ value: sql<number>`count(*)::int` }).from(kbCounties);
  const [oldest] = await db
    .select({ value: sql<Date | null>`min(${kbWageDeterminations.lastVerified})` })
    .from(kbWageDeterminations)
    .where(eq(kbWageDeterminations.isActive, true));
  const [parser] = await db
    .select({ value: kbWageDeterminations.parserVersion })
    .from(kbWageDeterminations)
    .orderBy(desc(kbWageDeterminations.fetchedAt))
    .limit(1);

  const oldestDate = oldest?.value ? new Date(oldest.value) : null;
  const activeCount = Number(active?.value ?? 0);
  return {
    activeDeterminations: activeCount,
    supersededRevisionsHeld: Number(superseded?.value ?? 0),
    determinationsWithHistory: Number(withHistory?.value ?? 0),
    classifications: Number(classifications?.value ?? 0),
    counties: Number(counties?.value ?? 0),
    oldestLastVerified: oldestDate ? oldestDate.toISOString() : null,
    // An empty corpus is not "fresh": gate G6 reports degraded either way.
    stale:
      activeCount === 0 ||
      !oldestDate ||
      (Date.now() - oldestDate.getTime()) / 86_400_000 > CORPUS_STALE_DAYS,
    lastRunStatus: null,
    parserVersion: parser?.value ?? null,
  };
}
