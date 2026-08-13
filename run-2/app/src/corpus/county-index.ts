/**
 * §6 — THE COUNTY x CONSTRUCTION-TYPE x CLASSIFICATION INDEX.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §6.2 (`county_class_rate`), §6.3 (what the free
 * surface reads), §6.4 (the free tier asserts a rate with no pin, so it is always a
 * draft).
 *
 * ---------------------------------------------------------------------------
 * THIS IS THE FREE TIER'S ENTIRE ALGORITHM
 *
 * D3's free tier is unlimited single WH-347 generation and county x craft rate
 * lookup with no account. D8's second channel is programmatic county x craft pages.
 * **Both read `county_class_rate` and nothing else.** Three consequences, and the
 * first is load-bearing for margin:
 *
 *  - The free tier makes **zero LLM calls**. It is an indexed lookup, and where a
 *    title does not resolve deterministically the page shows the WD's own
 *    classification list with verbatim scope text rather than ranking anything.
 *    The free generator is D8's primary funnel and would otherwise be an unbounded
 *    inference bill.
 *  - Every row already carries `wd_number`, `revision`, `publish_date` and
 *    `canonical_sha256`, so the provenance footer that makes the artifact a channel
 *    is free on the SEO surface too.
 *  - The view's own WHERE clause implements the field-scoped disagreement rule:
 *    `agreement IN ('agreed','advisory_variance')` PUBLISHES the VA record whose
 *    only variances are the `standard` flag and the structured county codes, while
 *    `parse_status = 'parsed'` keeps a quarantined determination out entirely — so
 *    a visitor sees "no published rate for this county and craft" rather than a
 *    rate we do not trust.
 *
 * ---------------------------------------------------------------------------
 * THE STALENESS ASYMMETRY, STATED SO A BUILDER CANNOT GET IT BACKWARDS (§6.4)
 *
 * At **L2 STALE** the free generator stops putting a corpus rate onto a new form —
 * every free-tier rate assertion is a first-time resolution with no pin behind it,
 * so it is precisely the class of claim D7 suppresses beyond 72 hours. But the
 * lookup page **keeps rendering**, from the last promoted snapshot, under a dated
 * narrowing (P-C) and with no currency framing. Never blank, never silently stale.
 *
 * Putting a corpus rate onto a NEW FORM is an assertion about the present and fails
 * closed. Showing what a determination SAID, under a dated line, is an assertion
 * about the past and does not. A blank page teaches the visitor nothing and hides
 * the staleness we are trying to disclose.
 */

import { sql } from 'drizzle-orm';

import { rowsOf } from '@/db';
import type { IsoDate, Sha256Hex, WdNumber } from '@/lib/types';
import { isoDate, sha256Hex, wdNumber as toWdNumber } from '@/lib/types';

import { normaliseCountyName } from './canonical';
import type { Executor } from './store';

export interface CountyClassRate {
  readonly stateCode: string;
  readonly countyName: string;
  readonly countyNameNorm: string;
  readonly independentCity: boolean;
  readonly constructionType: string;
  readonly className: string;
  readonly classNameNorm: string;
  readonly rateIdentifier: string;
  readonly identifierKind: string;
  readonly baseRateMilli: number;
  readonly fringeRateMilli: number;
  readonly totalRateMilli: number;
  readonly fringeTreatment: string;
  /** Provenance travels on every row: the footer is free on the SEO surface. */
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly publishDate: IsoDate;
  readonly canonicalSha256: Sha256Hex;
}

interface RawRow {
  state_code: string;
  county_name: string;
  county_name_norm: string;
  independent_city: boolean;
  construction_type: string;
  class_name: string;
  class_name_norm: string;
  rate_identifier: string;
  identifier_kind: string;
  base_rate_milli: number | string;
  fringe_rate_milli: number | string;
  total_rate_milli: number | string;
  fringe_treatment: string;
  wd_number: string;
  revision: number | string;
  publish_date: string | Date;
  canonical_sha256: Buffer | Uint8Array;
}

function toRate(row: RawRow): CountyClassRate {
  const publishDate =
    row.publish_date instanceof Date
      ? row.publish_date.toISOString().slice(0, 10)
      : String(row.publish_date).slice(0, 10);
  return {
    stateCode: row.state_code,
    countyName: row.county_name,
    countyNameNorm: row.county_name_norm,
    independentCity: row.independent_city,
    constructionType: row.construction_type,
    className: row.class_name,
    classNameNorm: row.class_name_norm,
    rateIdentifier: row.rate_identifier,
    identifierKind: row.identifier_kind,
    baseRateMilli: Number(row.base_rate_milli),
    fringeRateMilli: Number(row.fringe_rate_milli),
    totalRateMilli: Number(row.total_rate_milli),
    fringeTreatment: row.fringe_treatment,
    wdNumber: toWdNumber(row.wd_number),
    revision: Number(row.revision),
    publishDate: isoDate(publishDate),
    canonicalSha256: sha256Hex(Buffer.from(row.canonical_sha256).toString('hex')),
  };
}

export interface CountyLookupQuery {
  readonly stateCode: string;
  readonly countyName: string;
  readonly constructionType?: string;
  /** A craft term the visitor typed. Matched against `class_name_norm` as a
   *  CONTAINS, never as a ranking: the free tier does no ranking at all. */
  readonly craft?: string;
  readonly limit?: number;
}

/**
 * The county x craft lookup. Renders at every freshness level — the caller pairs it
 * with `corpusBanner()` for the dated narrowing rather than withholding the rows.
 */
export async function lookupCountyRates(
  db: Executor,
  query: CountyLookupQuery,
): Promise<readonly CountyClassRate[]> {
  const countyNorm = normaliseCountyName(query.countyName);
  const craft = query.craft ? normaliseCountyName(query.craft) : null;
  const limit = query.limit ?? 500;

  const rows = rowsOf<RawRow>(
    await db.execute(sql`
      SELECT * FROM county_class_rate
      WHERE state_code = ${query.stateCode.toUpperCase()}
        AND county_name_norm = ${countyNorm}
        AND (${query.constructionType ?? null}::text IS NULL
             OR construction_type = ${query.constructionType ?? null})
        AND (${craft}::text IS NULL OR class_name_norm LIKE '%' || ${craft} || '%')
      ORDER BY construction_type, class_name_norm, rate_identifier
      LIMIT ${limit}
    `),
  );
  return rows.map(toRate);
}

/** One WD's full classification list, with verbatim names — what the picker shows
 *  when a title does not resolve deterministically (§6.3, and the L-E/L-F path). */
export async function classificationsForWd(
  db: Executor,
  wd: WdNumber,
  revision: number,
): Promise<readonly CountyClassRate[]> {
  const rows = rowsOf<RawRow>(
    await db.execute(sql`
      SELECT * FROM county_class_rate
      WHERE wd_number = ${wd} AND revision = ${revision}
      ORDER BY class_name_norm, rate_identifier
    `),
  );
  return rows.map(toRate);
}

export interface CountyPage {
  readonly stateCode: string;
  readonly countyName: string;
  readonly countyNameNorm: string;
  readonly constructionType: string;
  readonly classCount: number;
}

/** The programmatic page set (D8 channel 2), enumerated from the mirror. */
export async function enumerateCountyPages(db: Executor): Promise<readonly CountyPage[]> {
  const rows = rowsOf<{
    state_code: string;
    county_name: string;
    county_name_norm: string;
    construction_type: string;
    class_count: number | string;
  }>(
    await db.execute(sql`
      SELECT state_code, min(county_name) AS county_name, county_name_norm, construction_type,
             count(*)::int AS class_count
      FROM county_class_rate
      GROUP BY state_code, county_name_norm, construction_type
      ORDER BY state_code, county_name_norm, construction_type
    `),
  );
  return rows.map((row) => ({
    stateCode: row.state_code,
    countyName: row.county_name,
    countyNameNorm: row.county_name_norm,
    constructionType: row.construction_type,
    classCount: Number(row.class_count),
  }));
}

/**
 * Refresh the public lookup surface INSIDE the promotion transaction, so the
 * lookup pages and the mirror are never observably out of step.
 *
 * SPEC CONFLICT, RESOLVED THE ONLY WAY POSTGRES ALLOWS. §6.2 says the refresh is
 * `REFRESH MATERIALIZED VIEW CONCURRENTLY … inside the promotion transaction`.
 * Those two requirements are mutually exclusive: `CONCURRENTLY` **cannot run inside
 * a transaction block** (Postgres raises `25001`). The transaction is the one that
 * carries the actual guarantee — atomicity with the state flip and the Merkle root
 * — so the refresh is non-concurrent. The cost is an ACCESS EXCLUSIVE lock for the
 * duration of a nightly refresh over ~479,000 rows; the benefit is that no reader
 * ever sees a promoted snapshot whose lookup index has not caught up. See the build
 * report.
 */
export async function refreshCountyClassIndex(db: Executor): Promise<void> {
  await db.execute(sql`REFRESH MATERIALIZED VIEW county_class_rate`);
}
