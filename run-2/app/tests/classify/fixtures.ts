/**
 * Fixtures for the classification ladder.
 *
 * The classification rows are `ENGINE.md` §15.3's own extract — the parsed rows of
 * `sam.gov/api/prod/wdol/v1/wd/VA20260195/2`, retrieved live on 2026-08-13
 * (`publishDate` 2026-08-06). Using the document's own example rather than an
 * invented one matters here: it carries the four properties §15.3 settles — scope
 * text that IS the determination's words, a name that wraps across two physical
 * lines, one union identifier among survey identifiers, and eight of ten rows at a
 * zero fringe.
 */

import type { PGlite } from '@electric-sql/pglite';

import type { PinnedRevision } from '@/classify';
import { MilliRate } from '@/lib/money';
import {
  classificationIdFromMirrorRow,
  isoDate,
  wdNumber,
  type Classification,
  type FringeTreatment,
  type IdentifierKind,
  type SnapshotRef,
} from '@/lib/types';

export const WD = wdNumber('VA20260195');
export const REVISION = 2;
export const PARSER_VERSION = 1;

interface Row {
  readonly ordinal: number;
  readonly identifier: string;
  readonly kind: IdentifierKind;
  readonly identifierDate: string;
  readonly name: string;
  readonly verbatim?: string;
  readonly base: string;
  readonly fringe: string;
  readonly lineStart: number;
  readonly lineEnd: number;
}

const ROWS: readonly Row[] = [
  {
    ordinal: 0,
    identifier: 'ELEC0080-011',
    kind: 'union',
    identifierDate: '2025-06-01',
    name: 'ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION',
    base: '36.85',
    fringe: '14.13',
    lineStart: 41,
    lineEnd: 41,
  },
  {
    ordinal: 1,
    identifier: 'SUVA2016-080',
    kind: 'survey',
    identifierDate: '2018-07-02',
    name: 'CARPENTER, INCLUDES FORM WORK',
    base: '20.21',
    fringe: '0.00',
    lineStart: 47,
    lineEnd: 47,
  },
  {
    ordinal: 2,
    identifier: 'SUVA2016-080',
    kind: 'survey',
    identifierDate: '2018-07-02',
    name: 'CEMENT MASON/CONCRETE FINISHER',
    base: '16.03',
    fringe: '0.00',
    lineStart: 48,
    lineEnd: 48,
  },
  {
    ordinal: 3,
    identifier: 'SUVA2016-080',
    kind: 'survey',
    identifierDate: '2018-07-02',
    name: 'IRONWORKER, REINFORCING',
    base: '24.03',
    fringe: '0.00',
    lineStart: 49,
    lineEnd: 49,
  },
  {
    ordinal: 4,
    identifier: 'SUVA2016-080',
    kind: 'survey',
    identifierDate: '2018-07-02',
    name: 'IRONWORKER, STRUCTURAL',
    base: '27.38',
    fringe: '0.00',
    lineStart: 50,
    lineEnd: 50,
  },
  {
    // §15.3 note 2: 31.8% of classification names wrap. This is the wrapped one.
    ordinal: 5,
    identifier: 'SUVA2016-080',
    kind: 'survey',
    identifierDate: '2018-07-02',
    name: 'LABORER: ASPHALT, INCLUDES RAKER, SHOVELER, SPREADER AND DISTRIBUTOR',
    verbatim:
      'LABORER:  ASPHALT, INCLUDES RAKER, SHOVELER,\nSPREADER AND DISTRIBUTOR............................$ 18.62                   2.62',
    base: '18.62',
    fringe: '2.62',
    lineStart: 51,
    lineEnd: 52,
  },
  {
    ordinal: 6,
    identifier: 'SUVA2016-080',
    kind: 'survey',
    identifierDate: '2018-07-02',
    name: 'LABORER: COMMON OR GENERAL',
    base: '14.85',
    fringe: '0.00',
    lineStart: 53,
    lineEnd: 53,
  },
  {
    ordinal: 7,
    identifier: 'SUVA2016-080',
    kind: 'survey',
    identifierDate: '2018-07-02',
    name: 'LABORER: PIPELAYER',
    base: '17.76',
    fringe: '0.00',
    lineStart: 54,
    lineEnd: 54,
  },
  {
    ordinal: 8,
    identifier: 'SUVA2016-080',
    kind: 'survey',
    identifierDate: '2018-07-02',
    name: 'OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE',
    base: '20.74',
    fringe: '0.00',
    lineStart: 55,
    lineEnd: 55,
  },
  {
    ordinal: 9,
    identifier: 'SUVA2016-080',
    kind: 'survey',
    identifierDate: '2018-07-02',
    name: 'OPERATOR: BOBCAT/SKID STEER/SKID LOADER',
    base: '19.16',
    fringe: '4.45',
    lineStart: 56,
    lineEnd: 56,
  },
];

/** The corpus's own `normaliseClassName`: whitespace-collapsed, `:` spaced,
 *  trailing dots stripped, uppercased. Reproduced here rather than imported so the
 *  classification fixture does not pull the ingest module into this suite's graph. */
function classNameNorm(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*:\s*/g, ': ')
    .replace(/\.+$/, '')
    .trim()
    .toUpperCase();
}

function fringeTreatmentFor(kind: IdentifierKind): FringeTreatment {
  // The DDL's `wdc_union_fringe` says it in SQL: a union-identified row may not
  // claim a fringe treatment implying we hold its CBA schedule (D9).
  return kind === 'union' || kind === 'union_average'
    ? 'wd_aggregate_cba_schedule_unpublished'
    : 'wd_aggregate';
}

export const VA_CLASSES: readonly Classification[] = ROWS.map((row) => ({
  id: classificationIdFromMirrorRow({
    wdNumber: WD,
    revision: REVISION,
    parserVersion: PARSER_VERSION,
    ordinal: row.ordinal,
  }),
  wdNumber: WD,
  revision: REVISION,
  ordinal: row.ordinal,
  rateIdentifier: row.identifier,
  identifierKind: row.kind,
  identifierDate: isoDate(row.identifierDate),
  className: row.name,
  classNameVerbatim: row.verbatim ?? row.name,
  classNameNorm: classNameNorm(row.name),
  baseRate: MilliRate.fromDecimalString(row.base),
  fringeRate: MilliRate.fromDecimalString(row.fringe),
  fringeTreatment: fringeTreatmentFor(row.kind),
  sourceLineStart: row.lineStart,
  sourceLineEnd: row.lineEnd,
  parserVersion: PARSER_VERSION,
  wrapped: row.verbatim !== undefined,
}));

export function classByName(name: string): Classification {
  const found = VA_CLASSES.find((row) => row.className === name);
  if (found === undefined) throw new Error(`no fixture classification named ${name}`);
  return found;
}

export const SNAPSHOT = 'snapshot-2026-08-13' as SnapshotRef;

export const PIN: PinnedRevision = {
  wdNumber: WD,
  revision: REVISION,
  publishDate: isoDate('2026-08-06'),
  snapshotRef: SNAPSHOT,
  stateCode: 'VA',
  constructionType: 'HEAVY',
};

// ===========================================================================
// Database fixtures
// ===========================================================================

/**
 * The minimum `wd_revision` the crosswalk's foreign key needs, written as the
 * OWNER. `wd_blob` is self-certifying — the primary key IS `digest(content)` — so
 * the fixture computes the digest in SQL rather than asserting one.
 */
export async function seedRevision(client: PGlite, revision = REVISION): Promise<void> {
  // `convert_to(text, 'UTF8')` rather than a bytea parameter: the store is
  // self-certifying (`digest(content) = blob_sha256`), so the digest is computed by
  // the same engine that checks it, and the fixture never hard-codes a hash.
  const body = `VA20260195 r${revision}`;
  await client.query(
    `INSERT INTO wd_blob (blob_sha256, byte_length, media_type, ingest_path, source_url,
                          fetched_at, http_status, content)
     VALUES (digest(convert_to($1, 'UTF8'), 'sha256'), octet_length(convert_to($1, 'UTF8')),
             'text/plain', 'B',
             'https://sam.gov/api/prod/wdol/v1/wd/VA20260195/' || $2, now(), 200,
             convert_to($1, 'UTF8'))
     ON CONFLICT (blob_sha256) DO NOTHING`,
    [body, String(revision)],
  );
  await client.query(
    `INSERT INTO wd_revision
       (wd_number, revision, state_code, wd_year, publish_date, header_date,
        is_active_upstream, canonical_sha256, canonical_length, blob_b_sha256,
        mod_table, mod_table_rows, mod_table_first, mod_table_last,
        agreement, parse_status, parse_version, class_count, construction_types)
     VALUES ('VA20260195', $2::smallint, 'VA', 2026, DATE '2026-08-06', DATE '2026-08-06', true,
             digest(convert_to($1, 'UTF8'), 'sha256'), octet_length(convert_to($1, 'UTF8')),
             digest(convert_to($1, 'UTF8'), 'sha256'),
             '[]'::jsonb, ($2::int + 1)::smallint, 0::smallint, $2::smallint,
             'agreed', 'parsed', 1, 10, ARRAY['HEAVY']::text[])
     ON CONFLICT (wd_number, revision) DO NOTHING`,
    [body, revision],
  );
}

/**
 * Five accounts that have each done real work — four RELEASED filings across two
 * projects — all confirming the same title to the same classification, then the
 * materialized view refreshed on its schedule (here, explicitly).
 *
 * That shape is the point: `crosswalk_eligible_account` is a COSTLY-SIGNAL test,
 * not a trust test, and a fixture that skipped the filings would seed a prior the
 * real view would never publish.
 */
export async function seedAggregatePrior(
  client: PGlite,
  input: {
    readonly titleNorm: string;
    readonly classNameNorm: string;
    readonly identifier: string;
    readonly accounts?: number;
  },
): Promise<void> {
  const accounts = input.accounts ?? 5;
  await seedRevision(client);
  await client.query(
    `INSERT INTO payroll_title (title_norm) VALUES ($1) ON CONFLICT DO NOTHING`,
    [input.titleNorm],
  );

  for (let index = 0; index < accounts; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const account = `aaaaaaaa-0000-4000-8000-0000000000${suffix}`;
    const user = `bbbbbbbb-0000-4000-8000-0000000000${suffix}`;
    await client.query(`INSERT INTO accounts (id, name) VALUES ($1, $2)`, [
      account,
      `Prior account ${suffix}`,
    ]);
    await client.query(`INSERT INTO users (id, email) VALUES ($1, $2)`, [
      user,
      `prior${suffix}@example.test`,
    ]);
    const projects = [
      `cccccccc-0000-4000-8000-0000000000${suffix}`,
      `dddddddd-0000-4000-8000-0000000000${suffix}`,
    ];
    for (const project of projects) {
      await client.query(
        `INSERT INTO projects
           (id, account_id, name, state_code, county_name, county_name_norm,
            construction_type, funding_source, contract_value_band,
            band_asserted_at, band_asserted_by)
         VALUES ($1, $2, 'Prior project', 'VA', 'Fairfax', 'FAIRFAX', 'HEAVY', 'FHWA',
                 'over_100k', now(), $3)`,
        [project, account, user],
      );
    }
    for (let filing = 0; filing < 4; filing += 1) {
      const project = projects[filing % 2] as string;
      await client.query(
        `INSERT INTO filings
           (id, account_id, project_id, week_ending, sequence, state, artifact_status,
            engine_version, build_sha, freshness_state, released_at)
         VALUES (gen_random_uuid(), $1, $2, DATE '2026-07-03' + ($3::int * 7), 1, 'RELEASED',
                 'CERTIFIABLE', 1, 'test', 'FRESH', now())`,
        [account, project, filing],
      );
    }
    await client.query(
      `INSERT INTO crosswalk_observation
         (account_id, confirmed_by_user_id, wd_number, revision, title_norm, title_raw,
          chosen_class_norm, chosen_identifier, provenance, offered, chosen_rank,
          ranker_version, resolved_at_level, llm_used)
       VALUES ($1, $2, 'VA20260195', $3, $4, $4, $5, $6, 'user_confirmed',
               '{"candidates":[]}'::jsonb, 1, 1, 'L_C2', false)`,
      [account, user, REVISION, input.titleNorm, input.classNameNorm, input.identifier],
    );
  }

  await client.exec('REFRESH MATERIALIZED VIEW crosswalk_prior');
}
