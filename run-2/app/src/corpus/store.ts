/**
 * THE MIRROR'S WRITE PATH.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §3 (the immutable revision store), §4.3
 * (classifications and residue), §6.2 (county scope), §8.2 (snapshots), §10.5
 * (probes). `ARCHITECTURE.md` §3.9's boundary table: `ingest/**` may write staging
 * tables and `probe_runs`; only `promotion/**` writes `wd_revision`, and only
 * inside a promotion transaction.
 *
 * ---------------------------------------------------------------------------
 * RAW SQL, ON PURPOSE
 *
 * `drizzle/0000_init.sql` is the schema of record and it carries things a table
 * declaration cannot express — `wd_blob_selfcert`'s `digest(content,'sha256') =
 * blob_sha256` CHECK, the append-only triggers, the generated diff columns, the
 * materialized views. Writing through parameterised SQL keeps this module honest
 * about what the database is actually enforcing, and every INSERT below is chosen
 * so that the DATABASE rejects the bad case rather than this code checking for it:
 *
 *   - a mislabelled blob cannot be inserted (`wd_blob_selfcert`);
 *   - a modification table that contradicts its revision cannot be written
 *     (`wd_rev_modlast` / `modrange` / `modsuffix`);
 *   - a union-identified class cannot claim we hold its CBA schedule
 *     (`wdc_union_fringe`);
 *   - two snapshots cannot be promoted at once (`corpus_snapshot_current`);
 *   - `advisory_variance` cannot carry a blocking field (`advisory_never_blocking`).
 *
 * `ON CONFLICT DO NOTHING` appears only where the natural key makes a repeat write
 * genuinely idempotent — re-fetching identical bytes, re-seeing an alias. It is
 * never used to paper over a conflicting value: `wd_revision_guard()` raises on any
 * attempt to change an immutable field, and that exception is the point.
 */

import { sql } from 'drizzle-orm';

import type { Db, Tx } from '@/db';
import type { Sha256Hex, WdNumber } from '@/lib/types';

import { hashBytes } from './canonical';
import { PARSER_VERSION } from './determination';
import type {
  FetchedBlob,
  IndexRecord,
  ModTable,
  ParsedClassification,
  ParseResidue,
  ProbeOutcome,
  SnapshotLeaf,
  SnapshotStateName,
  VarianceRecord,
} from './types';

export type Executor = Db | Tx;

/**
 * A Postgres `text[]` literal.
 *
 * Drizzle's `sql` template expands a JS array into a PARAMETER LIST — `($8, $9)` —
 * which Postgres reads as a record, not an array, and rejects with
 * `column "construction_types" is of type text[] but expression is of type record`.
 * Building the literal and casting it is the only spelling that survives both
 * drivers, and it is escaped here rather than at four call sites.
 */
function pgTextArray(values: readonly string[]): string {
  return `{${values.map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
}

// ===========================================================================
// Blobs — every response body, hashed and stored
// ===========================================================================

export async function insertBlob(db: Executor, blob: FetchedBlob): Promise<void> {
  await db.execute(sql`
    INSERT INTO wd_blob (blob_sha256, byte_length, media_type, ingest_path, source_url,
                         fetched_at, http_status, response_headers, content)
    VALUES (${hashBytes(blob.sha256)}, ${blob.byteLength}, ${blob.mediaType}, ${blob.path},
            ${blob.sourceUrl}, ${blob.fetchedAt}, ${blob.httpStatus},
            ${JSON.stringify(blob.responseHeaders)}::jsonb, ${Buffer.from(blob.bytes)})
    ON CONFLICT (blob_sha256) DO NOTHING
  `);
}

// ===========================================================================
// Snapshots
// ===========================================================================

export async function openSnapshot(db: Executor, snapshotRef: string): Promise<number> {
  const rows = await db.execute(sql`
    INSERT INTO corpus_snapshot (snapshot_ref, state) VALUES (${snapshotRef}, 'open')
    RETURNING snapshot_id
  `);
  const { rowsOf } = await import('@/db');
  const row = rowsOf<{ snapshot_id: string | number }>(rows)[0];
  if (!row) throw new Error('openSnapshot: no row returned');
  return Number(row.snapshot_id);
}

export async function setSnapshotState(
  db: Executor,
  snapshotId: number,
  state: SnapshotStateName,
  fields: {
    readonly holdReason?: string | null;
    readonly indexAlias?: string | null;
    readonly indexTotalActive?: number | null;
    readonly indexTotalAll?: number | null;
    readonly newRevisions?: number;
    readonly blockingVariances?: number;
    readonly quarantined?: number;
    readonly probeResults?: unknown;
    readonly goldenSuitePass?: boolean | null;
    readonly goldenSuiteLines?: number | null;
  } = {},
): Promise<void> {
  await db.execute(sql`
    UPDATE corpus_snapshot SET
      state = ${state}::snapshot_state,
      hold_reason         = coalesce(${fields.holdReason ?? null}, hold_reason),
      index_alias         = coalesce(${fields.indexAlias ?? null}, index_alias),
      index_total_active  = coalesce(${fields.indexTotalActive ?? null}, index_total_active),
      index_total_all     = coalesce(${fields.indexTotalAll ?? null}, index_total_all),
      new_revisions       = coalesce(${fields.newRevisions ?? null}, new_revisions),
      blocking_variances  = coalesce(${fields.blockingVariances ?? null}, blocking_variances),
      quarantined         = coalesce(${fields.quarantined ?? null}, quarantined),
      probe_results       = coalesce(${fields.probeResults === undefined ? null : JSON.stringify(fields.probeResults)}::jsonb, probe_results),
      golden_suite_pass   = coalesce(${fields.goldenSuitePass ?? null}, golden_suite_pass),
      golden_suite_lines  = coalesce(${fields.goldenSuiteLines ?? null}, golden_suite_lines)
    WHERE snapshot_id = ${snapshotId}
  `);
}

export async function insertIndexRecords(
  db: Executor,
  snapshotId: number,
  records: readonly IndexRecord[],
): Promise<void> {
  for (const record of records) {
    await db.execute(sql`
      INSERT INTO wd_index_record (snapshot_id, wd_number, revision, publish_date, modified_date,
                                   is_active, is_standard, construction_types, counties, index_alias)
      VALUES (${snapshotId}, ${record.wdNumber}, ${record.revisionNumber}, ${record.publishDate},
              ${record.modifiedDate}, ${record.isActive}, ${record.isStandard},
              ${pgTextArray([...record.constructionTypes])}::text[],
              ${JSON.stringify(record.counties)}::jsonb,
              ${record.indexAlias})
      ON CONFLICT (snapshot_id, wd_number) DO NOTHING
    `);
    for (const alias of record.aliases) {
      await db.execute(sql`
        INSERT INTO wd_alias (alias, wd_number) VALUES (${alias}, ${record.wdNumber})
        ON CONFLICT (alias, wd_number) DO NOTHING
      `);
    }
  }
}

// ===========================================================================
// Revisions and classifications — the promotion transaction's writes
// ===========================================================================

export interface RevisionWrite {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly stateCode: string | null;
  readonly wdYear: number;
  readonly shortName: string | null;
  readonly sequenceNo: number | null;
  readonly publishDate: string;
  readonly headerDate: string;
  readonly isActiveUpstream: boolean;
  readonly canonicalSha256: Sha256Hex;
  readonly canonicalLength: number;
  readonly blobA: Sha256Hex | null;
  readonly blobB: Sha256Hex;
  readonly blobC: Sha256Hex | null;
  readonly modTable: ModTable;
  readonly agreement: 'agreed' | 'advisory_variance' | 'blocking_variance' | 'single_path';
  readonly varianceDetail: readonly VarianceRecord[];
  readonly parseStatus: 'unparsed' | 'parsed' | 'partial' | 'quarantined';
  readonly classCount: number | null;
  readonly standardIndex: boolean | null;
  readonly standardDocument: boolean | null;
  readonly constructionTypes: readonly string[];
}

export async function insertRevision(db: Executor, write: RevisionWrite): Promise<void> {
  await db.execute(sql`
    INSERT INTO wd_revision (
      wd_number, revision, state_code, wd_year, short_name, sequence_no,
      publish_date, header_date, is_active_upstream,
      canonical_sha256, canonical_length, blob_a_sha256, blob_b_sha256, blob_c_sha256,
      mod_table, mod_table_rows, mod_table_first, mod_table_last,
      agreement, variance_detail, parse_status, parse_version, class_count,
      standard_index, standard_document, construction_types)
    VALUES (
      ${write.wdNumber}, ${write.revision}, ${write.stateCode}, ${write.wdYear},
      ${write.shortName}, ${write.sequenceNo},
      ${write.publishDate}::date, ${write.headerDate}::date, ${write.isActiveUpstream},
      ${hashBytes(write.canonicalSha256)}, ${write.canonicalLength},
      ${write.blobA ? hashBytes(write.blobA) : null}, ${hashBytes(write.blobB)},
      ${write.blobC ? hashBytes(write.blobC) : null},
      ${JSON.stringify(write.modTable.rows)}::jsonb, ${write.modTable.count},
      ${write.modTable.first}, ${write.modTable.last},
      ${write.agreement}::agreement_state, ${JSON.stringify(write.varianceDetail)}::jsonb,
      ${write.parseStatus}::parse_state, ${PARSER_VERSION}, ${write.classCount},
      ${write.standardIndex}, ${write.standardDocument},
      ${pgTextArray([...write.constructionTypes])}::text[])
    ON CONFLICT (wd_number, revision) DO NOTHING
  `);
}

/**
 * `superseded_on` is DERIVED, never asserted by upstream: it is the `publish_date`
 * of revision N+1. It is one of the three fields `wd_revision_guard()` permits to
 * change, because it legitimately moves without the determination moving.
 */
export async function markSuperseded(
  db: Executor,
  wdNumber: WdNumber,
  revision: number,
  supersededOn: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE wd_revision SET superseded_on = ${supersededOn}::date
    WHERE wd_number = ${wdNumber} AND revision = ${revision} AND superseded_on IS NULL
  `);
}

export async function insertClassifications(
  db: Executor,
  wdNumber: WdNumber,
  revision: number,
  canonicalSha256: Sha256Hex,
  classifications: readonly ParsedClassification[],
): Promise<void> {
  for (const c of classifications) {
    await db.execute(sql`
      INSERT INTO wd_classification (
        wd_number, revision, ordinal, rate_identifier, identifier_kind, identifier_date,
        class_name, class_name_raw, class_name_norm,
        base_rate_milli, fringe_rate_milli, fringe_treatment,
        source_line_start, source_line_end, source_sha256, parser_version, wrapped)
      VALUES (
        ${wdNumber}, ${revision}, ${c.ordinal}, ${c.rateIdentifier},
        ${c.identifierKind}::identifier_kind, ${c.identifierDate}::date,
        ${c.className}, ${c.classNameRaw}, ${c.classNameNorm},
        ${c.baseRateMilli}, ${c.fringeRateMilli}, ${c.fringeTreatment}::fringe_treatment,
        ${c.sourceLineStart}, ${c.sourceLineEnd}, ${hashBytes(canonicalSha256)},
        ${PARSER_VERSION}, ${c.wrapped})
      ON CONFLICT (wd_number, revision, parser_version, ordinal) DO NOTHING
    `);
  }
}

export async function insertResidue(
  db: Executor,
  wdNumber: WdNumber,
  revision: number,
  residue: readonly ParseResidue[],
): Promise<void> {
  for (const r of residue) {
    await db.execute(sql`
      INSERT INTO wd_parse_residue (wd_number, revision, line_start, line_end, raw_text, reason,
                                    parser_version)
      VALUES (${wdNumber}, ${revision}, ${r.lineStart}, ${r.lineEnd}, ${r.rawText}, ${r.reason},
              ${PARSER_VERSION})
      ON CONFLICT (wd_number, revision, line_start, parser_version) DO NOTHING
    `);
  }
}

export interface CountyWrite {
  readonly countyName: string;
  readonly countyNameNorm: string;
  readonly independentCity: boolean;
  readonly countyCode: number | null;
  readonly agreedWithIndex: boolean;
}

export async function insertCountyScope(
  db: Executor,
  wdNumber: WdNumber,
  revision: number,
  stateCode: string,
  counties: readonly CountyWrite[],
  statewide: boolean,
): Promise<void> {
  if (statewide) {
    // `statewideFlag` expands to every county in the state AT RENDER TIME rather
    // than being materialised — statewide determinations would otherwise dominate
    // the index (§6.1 rule 5).
    await db.execute(sql`
      INSERT INTO wd_county_scope (wd_number, revision, source, statewide, state_code)
      VALUES (${wdNumber}, ${revision}, 'prose', true, ${stateCode})
    `);
    return;
  }
  for (const county of counties) {
    await db.execute(sql`
      INSERT INTO wd_county_scope (wd_number, revision, source, county_name, county_name_norm,
                                   county_code, independent_city, state_code)
      VALUES (${wdNumber}, ${revision}, 'prose', ${county.countyName}, ${county.countyNameNorm},
              ${county.countyCode}, ${county.independentCity}, ${stateCode})
    `);
    await db.execute(sql`
      INSERT INTO wd_county_resolved (wd_number, revision, state_code, county_name_norm,
                                      county_name, independent_city, county_code, agreed_with_index)
      VALUES (${wdNumber}, ${revision}, ${stateCode}, ${county.countyNameNorm}, ${county.countyName},
              ${county.independentCity}, ${county.countyCode}, ${county.agreedWithIndex})
      ON CONFLICT (wd_number, revision, county_name_norm) DO NOTHING
    `);
  }
}

// ===========================================================================
// Variances and probes
// ===========================================================================

export async function insertAdvisoryVariances(
  db: Executor,
  snapshotId: number,
  wdNumber: WdNumber,
  revision: number,
  variances: readonly VarianceRecord[],
): Promise<void> {
  for (const v of variances) {
    await db.execute(sql`
      INSERT INTO advisory_variance (snapshot_id, wd_number, revision, field,
                                     value_path_a, value_path_b, value_path_c, value_path_d, detail)
      VALUES (${snapshotId}, ${wdNumber}, ${revision}, ${v.field},
              ${v.valuePathA}, ${v.valuePathB}, ${v.valuePathC}, ${v.valuePathD},
              ${JSON.stringify(v.detail)}::jsonb)
    `);
  }
}

export async function insertProbeRun(
  db: Executor,
  snapshotId: number | null,
  outcome: ProbeOutcome,
): Promise<number> {
  const rows = await db.execute(sql`
    INSERT INTO probe_run (snapshot_id, probe, result, observed, expected, delta_pct, detail)
    VALUES (${snapshotId}, ${outcome.probe}::probe_id, ${outcome.result}::probe_result,
            ${JSON.stringify(outcome.observed)}::jsonb, ${JSON.stringify(outcome.expected)}::jsonb,
            ${outcome.deltaPct}, ${outcome.detail})
    RETURNING probe_run_id
  `);
  const { rowsOf } = await import('@/db');
  const row = rowsOf<{ probe_run_id: string | number }>(rows)[0];
  if (!row) throw new Error('insertProbeRun: no row returned');
  return Number(row.probe_run_id);
}

/**
 * A freeze closes ITSELF after three consecutive clean runs of the probe that
 * opened it. There is no manual clear, because a manual clear is a human minute
 * (A6) and, worse, a human judgement call about upstream health made under
 * pressure. `corpus_freeze_open` makes "at most one open row" a database fact.
 */
export async function openFreeze(
  db: Executor,
  input: { readonly probe: ProbeOutcome['probe']; readonly probeRunId: number; readonly bannerText: string },
): Promise<void> {
  await db.execute(sql`
    INSERT INTO corpus_freeze (probe, probe_run_id, banner_text)
    SELECT ${input.probe}::probe_id, ${input.probeRunId}, ${input.bannerText}
    WHERE NOT EXISTS (SELECT 1 FROM corpus_freeze WHERE closed_at IS NULL)
  `);
}

export async function closeFreezeIfClean(db: Executor, cleanRuns: number): Promise<boolean> {
  if (cleanRuns < 3) return false;
  const rows = await db.execute(sql`
    UPDATE corpus_freeze SET closed_at = now(), auto_closed = true
    WHERE closed_at IS NULL
    RETURNING freeze_id
  `);
  const { rowsOf } = await import('@/db');
  return rowsOf(rows).length > 0;
}

export async function isFrozen(db: Executor): Promise<boolean> {
  const rows = await db.execute(
    sql`SELECT 1 AS open FROM corpus_freeze WHERE closed_at IS NULL LIMIT 1`,
  );
  const { rowsOf } = await import('@/db');
  return rowsOf(rows).length > 0;
}

// ===========================================================================
// Reads the promotion job needs
// ===========================================================================

export interface HighWaterMark {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly canonicalSha256: Sha256Hex;
  readonly canonicalLength: number;
  readonly classCount: number | null;
}

export async function highWaterMarks(db: Executor): Promise<Map<WdNumber, HighWaterMark>> {
  const { rowsOf } = await import('@/db');
  const rows = rowsOf<{
    wd_number: string;
    revision: number;
    canonical_sha256: Buffer | Uint8Array;
    canonical_length: number;
    class_count: number | null;
  }>(
    await db.execute(sql`
      SELECT DISTINCT ON (wd_number)
             wd_number, revision, canonical_sha256, canonical_length, class_count
      FROM wd_revision
      ORDER BY wd_number, revision DESC
    `),
  );
  const { hashHex } = await import('./canonical');
  const map = new Map<WdNumber, HighWaterMark>();
  for (const row of rows) {
    map.set(row.wd_number as WdNumber, {
      wdNumber: row.wd_number as WdNumber,
      revision: Number(row.revision),
      canonicalSha256: hashHex(Buffer.from(row.canonical_sha256)),
      canonicalLength: Number(row.canonical_length),
      classCount: row.class_count === null ? null : Number(row.class_count),
    });
  }
  return map;
}

export async function lastGoodActiveCount(db: Executor): Promise<number | null> {
  const { rowsOf } = await import('@/db');
  const rows = rowsOf<{ index_total_active: number | null }>(
    await db.execute(sql`
      SELECT index_total_active FROM corpus_snapshot
      WHERE state IN ('promoted', 'superseded') AND index_total_active IS NOT NULL
      ORDER BY promoted_at DESC NULLS LAST, snapshot_id DESC
      LIMIT 1
    `),
  );
  const value = rows[0]?.index_total_active;
  return value === undefined || value === null ? null : Number(value);
}

export async function lastIndexAlias(db: Executor): Promise<string | null> {
  const { rowsOf } = await import('@/db');
  const rows = rowsOf<{ index_alias: string | null }>(
    await db.execute(sql`
      SELECT index_alias FROM corpus_snapshot
      WHERE state IN ('promoted', 'superseded') AND index_alias IS NOT NULL
      ORDER BY promoted_at DESC NULLS LAST, snapshot_id DESC
      LIMIT 1
    `),
  );
  return rows[0]?.index_alias ?? null;
}

/**
 * §11.1's clock, read from the only place it can honestly come from: the last time
 * a snapshot passed every gate and was PROMOTED.
 */
export async function corpusVerifiedAt(db: Executor): Promise<Date | null> {
  const { rowsOf } = await import('@/db');
  const rows = rowsOf<{ verified_at: string | Date | null }>(
    await db.execute(sql`
      SELECT max(promoted_at) AS verified_at FROM corpus_snapshot
      WHERE state IN ('promoted', 'superseded')
    `),
  );
  const value = rows[0]?.verified_at;
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export async function promotedSnapshotLeaves(db: Executor): Promise<readonly SnapshotLeaf[]> {
  const { rowsOf } = await import('@/db');
  const { hashHex } = await import('./canonical');
  const rows = rowsOf<{ wd_number: string; revision: number; canonical_sha256: Buffer }>(
    await db.execute(sql`
      SELECT wd_number, revision, canonical_sha256 FROM wd_revision
      WHERE parse_status = 'parsed' AND agreement IN ('agreed', 'advisory_variance')
      ORDER BY wd_number, revision
    `),
  );
  return rows.map((row) => ({
    wdNumber: row.wd_number as WdNumber,
    revision: Number(row.revision),
    canonicalSha256: hashHex(Buffer.from(row.canonical_sha256)),
  }));
}

export async function determinationText(
  db: Executor,
  canonicalSha256: Sha256Hex,
): Promise<string | null> {
  const { rowsOf } = await import('@/db');
  const rows = rowsOf<{ content: Buffer }>(
    await db.execute(sql`
      SELECT b.content
      FROM wd_revision r
      JOIN wd_blob b ON b.blob_sha256 = r.blob_b_sha256
      WHERE r.canonical_sha256 = ${hashBytes(canonicalSha256)}
      LIMIT 1
    `),
  );
  const row = rows[0];
  if (!row) return null;
  const { canon } = await import('./canonical');
  const parsed = JSON.parse(Buffer.from(row.content).toString('utf8')) as { document?: string };
  return parsed.document === undefined ? null : canon(parsed.document);
}
