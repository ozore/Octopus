/**
 * THE ANONYMOUS SURFACE'S READ MODEL — the only data path under `(free)`.
 *
 * AUTHORITY: `ARCHITECTURE.md` §3.1 (the `/` and `/rates/**` routes may touch "the
 * mirror read model only"; `/wh347` may touch "the free-generator engine; no tenant
 * tables"), §3.3 (the four functions the mirror read model exposes),
 * `CORPUS_DESIGN.md` §6.2–§6.4 (the county x classification index and the staleness
 * asymmetry), `USER_JOURNEY.md` §1 (J1) and §2 (J2).
 *
 * ===========================================================================
 * WHAT THIS MODULE MAY TOUCH, AND WHAT IT MAY NOT
 *
 * Every query below reads the GLOBAL mirror — `wd_revision`, `wd_classification`,
 * `wd_county_resolved`, `corpus_snapshot`, `corpus_freeze` and the
 * `county_class_rate` materialized view. There is no tenant table in this file and
 * there must never be one: the anonymous surface has no account, no session and no
 * `TenantContext` to evaluate a policy against, so a join onto a tenant table here
 * would be an unauthenticated read of customer data rather than a bug in a policy.
 *
 * Nothing here writes. Nothing here calls SAM, Anthropic or Stripe. The whole free
 * path is an indexed lookup, which is what makes it **zero model calls** (deep dive
 * 03's margin non-negotiable) and what makes it the tested fallback the paid product
 * degrades to when the model budget trips or Anthropic is unreachable
 * (`ARCHITECTURE.md` §3.8).
 *
 * ===========================================================================
 * WHY THE `Classification` PROJECTION LIVES HERE
 *
 * `ClassificationId` is branded with a private symbol and its only constructor is
 * `classificationIdFromMirrorRow`, "which the mirror read model calls and nobody
 * else should" (`src/lib/types.ts`). `classificationsOf` below is that call for the
 * anonymous surface: every candidate the free picker can offer, and every rate the
 * free engine can price, arrives from a row of the determination this visitor named.
 * A hallucinated class name is not rejected here — it was never sampleable (I2).
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '@/db';
import {
  ladderLevels,
  freshnessOf,
  normaliseCountyName,
  type LadderInput,
} from '@/corpus';
import { MilliRate } from '@/lib/money';
import {
  classificationIdFromMirrorRow,
  isoDate,
  sha256Hex,
  wdNumber as toWdNumber,
  type Classification,
  type CorpusLadderLevel,
  type Freshness,
  type FringeTreatment,
  type IdentifierKind,
  type IsoDate,
  type Sha256Hex,
  type SnapshotRef,
  type WdNumber,
} from '@/lib/types';

// ===========================================================================
// The corpus state every free surface stamps
// ===========================================================================

/**
 * What the corpus can say about itself right now.
 *
 * `snapshotRef` and `merkleRoot` are the last PROMOTED snapshot's, and
 * `verifiedAt` is `max(promoted_at)` over promoted and superseded snapshots — the
 * last time a snapshot passed every gate, not the last time the cron ran
 * (`src/corpus/ladder.ts`). A job that runs every night and is held every night
 * advances nothing, and the free surface must show that the same way the paid one
 * does.
 */
export interface CorpusState {
  readonly verifiedAt: Date | null;
  readonly snapshotRef: SnapshotRef | null;
  readonly merkleRoot: Sha256Hex | null;
  readonly levels: readonly CorpusLadderLevel[];
  readonly freshness: Freshness;
  readonly ladder: LadderInput;
}

export async function corpusState(db: Db, now: Date): Promise<CorpusState> {
  const promoted = rowsOf<{
    snapshot_ref: string | null;
    merkle_root: Buffer | Uint8Array | null;
    promoted_at: Date | string | null;
  }>(
    await db.execute(sql`
      SELECT snapshot_ref, merkle_root, promoted_at
      FROM corpus_snapshot
      WHERE state IN ('promoted', 'superseded') AND promoted_at IS NOT NULL
      ORDER BY promoted_at DESC
      LIMIT 1
    `),
  )[0];

  const held = rowsOf<{ n: number | string }>(
    await db.execute(sql`
      SELECT count(*)::int AS n FROM corpus_snapshot WHERE state = 'held'
    `),
  )[0];

  const frozen = rowsOf<{ n: number | string }>(
    await db.execute(sql`
      SELECT count(*)::int AS n FROM corpus_freeze WHERE closed_at IS NULL
    `),
  )[0];

  const quarantined = rowsOf<{ n: number | string }>(
    await db.execute(sql`
      SELECT count(*)::int AS n FROM wd_revision WHERE parse_status = 'quarantined'
    `),
  )[0];

  const verifiedAt =
    promoted?.promoted_at == null
      ? null
      : promoted.promoted_at instanceof Date
        ? promoted.promoted_at
        : new Date(String(promoted.promoted_at));

  const ladder: LadderInput = {
    corpusVerifiedAt: verifiedAt,
    now,
    frozenByProbe: Number(frozen?.n ?? 0) > 0,
    quarantineOpen: Number(held?.n ?? 0) > 0 || Number(quarantined?.n ?? 0) > 0,
    // The DIR schema pin and the golden canary are the worker's business, not the
    // anonymous surface's: neither changes a rate lookup or a WH-347 PDF, and
    // `CORPUS_LADDER` gives L4 `blocksEcprGeneration` and L5 `blocksPromotion`
    // only. Reading them here would put two banners on a page that neither one is
    // about.
    xsdMismatch: false,
    canaryRed: false,
  };

  return {
    verifiedAt,
    snapshotRef: (promoted?.snapshot_ref ?? null) as SnapshotRef | null,
    merkleRoot:
      promoted?.merkle_root == null
        ? null
        : sha256Hex(Buffer.from(promoted.merkle_root).toString('hex')),
    levels: ladderLevels(ladder),
    freshness: freshnessOf({ corpusVerifiedAt: verifiedAt, now }),
    ladder,
  };
}

// ===========================================================================
// Geography — what the programmatic page set is enumerated from
// ===========================================================================

export interface StateRow {
  readonly stateCode: string;
  readonly countyCount: number;
  readonly classCount: number;
}

export async function statesWithRates(db: Db): Promise<readonly StateRow[]> {
  const rows = rowsOf<{ state_code: string; counties: number | string; classes: number | string }>(
    await db.execute(sql`
      SELECT state_code,
             count(DISTINCT county_name_norm)::int AS counties,
             count(*)::int AS classes
      FROM county_class_rate
      GROUP BY state_code
      ORDER BY state_code
    `),
  );
  return rows.map((row) => ({
    stateCode: row.state_code,
    countyCount: Number(row.counties),
    classCount: Number(row.classes),
  }));
}

export interface CountyRow {
  readonly stateCode: string;
  readonly countyName: string;
  readonly countyNameNorm: string;
  readonly independentCity: boolean;
  readonly constructionTypes: readonly string[];
  readonly classCount: number;
}

export async function countiesInState(db: Db, stateCode: string): Promise<readonly CountyRow[]> {
  const rows = rowsOf<{
    state_code: string;
    county_name: string;
    county_name_norm: string;
    independent_city: boolean;
    construction_types: string[];
    classes: number | string;
  }>(
    await db.execute(sql`
      SELECT state_code,
             min(county_name) AS county_name,
             county_name_norm,
             bool_or(independent_city) AS independent_city,
             array_agg(DISTINCT construction_type ORDER BY construction_type) AS construction_types,
             count(*)::int AS classes
      FROM county_class_rate
      WHERE state_code = ${stateCode.toUpperCase()}
      GROUP BY state_code, county_name_norm
      ORDER BY county_name_norm
    `),
  );
  return rows.map((row) => ({
    stateCode: row.state_code,
    countyName: row.county_name,
    countyNameNorm: row.county_name_norm,
    independentCity: row.independent_city,
    constructionTypes: row.construction_types,
    classCount: Number(row.classes),
  }));
}

// ===========================================================================
// The determinations that cover a county — J2's "active determinations"
// ===========================================================================

export interface DeterminationRow {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly publishDate: IsoDate;
  readonly constructionType: string;
  readonly countyName: string;
  readonly independentCity: boolean;
  readonly classCount: number;
  readonly canonicalSha256: Sha256Hex;
}

/** Every active determination covering one county, by construction type. */
export async function determinationsForCounty(
  db: Db,
  input: { readonly stateCode: string; readonly countyName: string },
): Promise<readonly DeterminationRow[]> {
  const rows = rowsOf<{
    wd_number: string;
    revision: number | string;
    publish_date: string | Date;
    construction_type: string;
    county_name: string;
    independent_city: boolean;
    classes: number | string;
    canonical_sha256: string;
  }>(
    await db.execute(sql`
      SELECT wd_number, revision, publish_date, construction_type,
             min(county_name) AS county_name,
             bool_or(independent_city) AS independent_city,
             count(*)::int AS classes,
             min(encode(canonical_sha256, 'hex')) AS canonical_sha256
      FROM county_class_rate
      WHERE state_code = ${input.stateCode.toUpperCase()}
        AND county_name_norm = ${normaliseCountyName(input.countyName)}
      GROUP BY wd_number, revision, publish_date, construction_type
      ORDER BY construction_type, wd_number
    `),
  );
  return rows.map((row) => ({
    wdNumber: toWdNumber(row.wd_number),
    revision: Number(row.revision),
    publishDate: toIsoDate(row.publish_date),
    constructionType: row.construction_type,
    countyName: row.county_name,
    independentCity: row.independent_city,
    classCount: Number(row.classes),
    canonicalSha256: sha256Hex(row.canonical_sha256),
  }));
}

/**
 * Resolve a determination number the visitor typed off their contract.
 *
 * Returns the highest revision the mirror holds that is still active and parsed.
 * `null` is a real answer — S06's rule, applied to the free generator: we never take
 * an input we cannot resolve and pretend we resolved it.
 */
export async function activeDetermination(
  db: Db,
  wd: WdNumber,
): Promise<{
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly publishDate: IsoDate;
  readonly canonicalSha256: Sha256Hex;
  readonly constructionTypes: readonly string[];
  readonly classCount: number;
} | null> {
  const row = rowsOf<{
    wd_number: string;
    revision: number | string;
    publish_date: string | Date;
    canonical_sha256: Buffer | Uint8Array;
    construction_types: string[];
    class_count: number | string | null;
  }>(
    await db.execute(sql`
      SELECT wd_number, revision, publish_date, canonical_sha256, construction_types, class_count
      FROM wd_revision
      WHERE wd_number = ${String(wd)}
        AND superseded_on IS NULL
        AND is_active_upstream
        AND parse_status = 'parsed'
        AND agreement IN ('agreed', 'advisory_variance')
      ORDER BY revision DESC
      LIMIT 1
    `),
  )[0];
  if (!row) return null;
  return {
    wdNumber: toWdNumber(row.wd_number),
    revision: Number(row.revision),
    publishDate: toIsoDate(row.publish_date),
    canonicalSha256: sha256Hex(Buffer.from(row.canonical_sha256).toString('hex')),
    constructionTypes: row.construction_types,
    classCount: Number(row.class_count ?? 0),
  };
}

/** Every revision of a determination the mirror holds, newest first. S06's honest
 *  "active revisions we hold" sentence, and J2's revision history. */
export async function revisionsHeld(
  db: Db,
  wd: WdNumber,
): Promise<
  readonly {
    readonly revision: number;
    readonly publishDate: IsoDate;
    readonly headerDate: IsoDate;
    readonly supersededOn: IsoDate | null;
    readonly isActiveUpstream: boolean;
    readonly firstSeenAt: Date;
    readonly classCount: number;
    readonly parseStatus: string;
  }[]
> {
  const rows = rowsOf<{
    revision: number | string;
    publish_date: string | Date;
    header_date: string | Date;
    superseded_on: string | Date | null;
    is_active_upstream: boolean;
    first_seen_at: Date | string;
    class_count: number | string | null;
    parse_status: string;
  }>(
    await db.execute(sql`
      SELECT revision, publish_date, header_date, superseded_on, is_active_upstream,
             first_seen_at, class_count, parse_status
      FROM wd_revision
      WHERE wd_number = ${String(wd)}
      ORDER BY revision DESC
    `),
  );
  return rows.map((row) => ({
    revision: Number(row.revision),
    publishDate: toIsoDate(row.publish_date),
    headerDate: toIsoDate(row.header_date),
    supersededOn: row.superseded_on == null ? null : toIsoDate(row.superseded_on),
    isActiveUpstream: row.is_active_upstream,
    firstSeenAt: row.first_seen_at instanceof Date ? row.first_seen_at : new Date(String(row.first_seen_at)),
    classCount: Number(row.class_count ?? 0),
    parseStatus: row.parse_status,
  }));
}

// ===========================================================================
// The dated diff — J2 §2.4, the one thing on the page nobody else has assembled
// ===========================================================================

export type DiffKind =
  | 'added'
  | 'removed'
  | 'rate_changed'
  | 'fringe_changed'
  | 'both_changed'
  | 'unchanged';

export interface ClassDiffRow {
  readonly classNameNorm: string;
  readonly className: string;
  readonly kind: DiffKind;
  readonly baseFromMilli: number | null;
  readonly baseToMilli: number | null;
  readonly fringeFromMilli: number | null;
  readonly fringeToMilli: number | null;
}

/**
 * The per-classification diff between two revisions of one determination.
 *
 * COMPUTED FROM THE TWO PARSED REVISIONS AT READ TIME, not read from
 * `wd_class_diff`. That table exists in the schema and the nightly promotion does
 * not populate it; a page that read an empty table would print "nothing changed",
 * which is the one wrong answer a rate-change page can give. A `FULL OUTER JOIN`
 * over the two revisions' own rows cannot say that: a class present on one side and
 * absent on the other is `added` or `removed`, and a class on both sides is
 * compared field by field.
 *
 * Matched on `class_name_norm`, which is the same key the crosswalk and the L-C1
 * exact-match rung use. A rename therefore shows as one `removed` and one `added`
 * rather than as a silent rate move, and that is the conservative direction: we
 * would rather show a reader two rows they can compare than assert an identity
 * between two different strings.
 */
export async function revisionDiff(
  db: Db,
  wd: WdNumber,
  revFrom: number,
  revTo: number,
): Promise<readonly ClassDiffRow[]> {
  const rows = rowsOf<{
    class_name_norm: string;
    class_name: string;
    base_from: number | string | null;
    base_to: number | string | null;
    fringe_from: number | string | null;
    fringe_to: number | string | null;
  }>(
    await db.execute(sql`
      WITH a AS (
        SELECT class_name_norm, min(class_name) AS class_name,
               min(base_rate_milli) AS base, min(fringe_rate_milli) AS fringe
        FROM wd_classification_current
        WHERE wd_number = ${String(wd)} AND revision = ${revFrom}
        GROUP BY class_name_norm
      ), b AS (
        SELECT class_name_norm, min(class_name) AS class_name,
               min(base_rate_milli) AS base, min(fringe_rate_milli) AS fringe
        FROM wd_classification_current
        WHERE wd_number = ${String(wd)} AND revision = ${revTo}
        GROUP BY class_name_norm
      )
      SELECT coalesce(b.class_name_norm, a.class_name_norm) AS class_name_norm,
             coalesce(b.class_name, a.class_name)           AS class_name,
             a.base AS base_from, b.base AS base_to,
             a.fringe AS fringe_from, b.fringe AS fringe_to
      FROM a FULL OUTER JOIN b ON a.class_name_norm = b.class_name_norm
      ORDER BY 1
    `),
  );

  return rows.map((row) => {
    const baseFrom = row.base_from == null ? null : Number(row.base_from);
    const baseTo = row.base_to == null ? null : Number(row.base_to);
    const fringeFrom = row.fringe_from == null ? null : Number(row.fringe_from);
    const fringeTo = row.fringe_to == null ? null : Number(row.fringe_to);
    return {
      classNameNorm: row.class_name_norm,
      className: row.class_name,
      kind: diffKind(baseFrom, baseTo, fringeFrom, fringeTo),
      baseFromMilli: baseFrom,
      baseToMilli: baseTo,
      fringeFromMilli: fringeFrom,
      fringeToMilli: fringeTo,
    };
  });
}

function diffKind(
  baseFrom: number | null,
  baseTo: number | null,
  fringeFrom: number | null,
  fringeTo: number | null,
): DiffKind {
  if (baseFrom === null && fringeFrom === null) return 'added';
  if (baseTo === null && fringeTo === null) return 'removed';
  const baseMoved = baseFrom !== baseTo;
  const fringeMoved = fringeFrom !== fringeTo;
  if (baseMoved && fringeMoved) return 'both_changed';
  if (baseMoved) return 'rate_changed';
  if (fringeMoved) return 'fringe_changed';
  return 'unchanged';
}

/**
 * One classification's rate at every revision the mirror holds, oldest first.
 *
 * THIS IS THE ASSEMBLY §2.4 SAYS THE PAGE EXISTS FOR. Measured on 2026-08-13: a
 * superseded revision is retrievable from SAM's own archive path and at least one
 * vendor resells the series at a low monthly price, so possession of the data is
 * not what distinguishes this page and no surface of this company may claim that it
 * is. What distinguishes it is the assembly — one classification, followed across
 * every revision, with the publication date it moved on — which is work a searcher
 * worried about a rate change actually wants and would otherwise do by hand across
 * N text files.
 *
 * Matched on `class_name_norm`, so a renamed classification appears as two series
 * rather than as one series with an invented continuity.
 */
export async function classificationHistory(
  db: Db,
  wd: WdNumber,
  classNameNorm: string,
): Promise<
  readonly {
    readonly revision: number;
    readonly publishDate: IsoDate;
    readonly className: string;
    readonly rateIdentifier: string;
    readonly baseRateMilli: number;
    readonly fringeRateMilli: number;
  }[]
> {
  const rows = rowsOf<{
    revision: number | string;
    publish_date: string | Date;
    class_name: string;
    rate_identifier: string;
    base_rate_milli: number | string;
    fringe_rate_milli: number | string;
  }>(
    await db.execute(sql`
      SELECT r.revision, r.publish_date,
             min(c.class_name)      AS class_name,
             min(c.rate_identifier) AS rate_identifier,
             min(c.base_rate_milli)   AS base_rate_milli,
             min(c.fringe_rate_milli) AS fringe_rate_milli
      FROM wd_revision r
      JOIN wd_classification_current c
        ON c.wd_number = r.wd_number AND c.revision = r.revision
      WHERE r.wd_number = ${String(wd)} AND c.class_name_norm = ${classNameNorm}
      GROUP BY r.revision, r.publish_date
      ORDER BY r.revision
    `),
  );
  return rows.map((row) => ({
    revision: Number(row.revision),
    publishDate: toIsoDate(row.publish_date),
    className: row.class_name,
    rateIdentifier: row.rate_identifier,
    baseRateMilli: Number(row.base_rate_milli),
    fringeRateMilli: Number(row.fringe_rate_milli),
  }));
}

// ===========================================================================
// The classification rows themselves — the ONLY constructor of ClassificationId
// ===========================================================================

/**
 * Every parsed classification of one revision, as `Classification` values.
 *
 * This is the mirror read model's `classificationsFor(pin)` for the anonymous
 * surface, and it is the only place under `(free)` that mints a `ClassificationId`.
 * The picker's candidate set and the engine's rate table are both closed
 * enumerations of what this returns, which is invariant I2.
 */
export async function classificationsOf(
  db: Db,
  wd: WdNumber,
  revision: number,
): Promise<readonly Classification[]> {
  const rows = rowsOf<{
    ordinal: number | string;
    parser_version: number | string;
    rate_identifier: string;
    identifier_kind: string;
    identifier_date: string | Date | null;
    class_name: string;
    class_name_raw: string;
    class_name_norm: string;
    base_rate_milli: number | string;
    fringe_rate_milli: number | string;
    fringe_treatment: string;
    source_line_start: number | string;
    source_line_end: number | string;
    wrapped: boolean;
  }>(
    await db.execute(sql`
      SELECT ordinal, parser_version, rate_identifier, identifier_kind, identifier_date,
             class_name, class_name_raw, class_name_norm,
             base_rate_milli, fringe_rate_milli, fringe_treatment,
             source_line_start, source_line_end, wrapped
      FROM wd_classification_current
      WHERE wd_number = ${String(wd)} AND revision = ${revision}
      ORDER BY ordinal
    `),
  );

  return rows.map((row) => {
    const parserVersion = Number(row.parser_version);
    const ordinal = Number(row.ordinal);
    return {
      id: classificationIdFromMirrorRow({ wdNumber: wd, revision, parserVersion, ordinal }),
      wdNumber: wd,
      revision,
      ordinal,
      rateIdentifier: row.rate_identifier,
      identifierKind: row.identifier_kind as IdentifierKind,
      identifierDate: row.identifier_date == null ? null : toIsoDate(row.identifier_date),
      className: row.class_name,
      // The determination's OWN lines, newlines preserved. The picker shows this
      // verbatim, because every explanation in this product is the source text
      // sitting next to the decision it governs.
      classNameVerbatim: row.class_name_raw,
      classNameNorm: row.class_name_norm,
      baseRate: MilliRate.of(Number(row.base_rate_milli)),
      fringeRate: MilliRate.of(Number(row.fringe_rate_milli)),
      fringeTreatment: row.fringe_treatment as FringeTreatment,
      sourceLineStart: Number(row.source_line_start),
      sourceLineEnd: Number(row.source_line_end),
      parserVersion,
      wrapped: row.wrapped,
    } satisfies Classification;
  });
}

// ===========================================================================
// Shared coercion
// ===========================================================================

function toIsoDate(value: string | Date): IsoDate {
  return isoDate(
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10),
  );
}
