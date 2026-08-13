/**
 * Ratepin data model — the Drizzle typed mirror.
 *
 * `drizzle/*.sql` IS THE SCHEMA OF RECORD. This file is the typed surface the
 * application queries through, and `tests/schema-parity.test.ts` asserts that
 * every table and column declared here exists in the migrated database with the
 * same name — so the mirror cannot silently drift from the SQL, and an agent
 * adding a column in one place and not the other fails the suite rather than
 * discovering it in production.
 *
 * The SQL carries what a table declaration cannot, and all of it is load-bearing:
 * the append-only triggers on the mirror (I5), `wd_blob_selfcert`'s
 * `digest(content,'sha256') = blob_sha256` CHECK, the row-level security policies
 * and the tenant-context functions (ADR-011), and four views —
 * `wd_classification_current`, `pin_standing`, `crosswalk_eligible_account`,
 * `crosswalk_prior`, `county_class_rate`. Read `drizzle/0000_init.sql` for the
 * reasoning; this file does not repeat it.
 *
 * TWO CONVENTIONS THAT APPLY EVERYWHERE:
 *
 *  1. MONEY IS AN INTEGER. Cents columns are `bigint({mode:'number'})` and hold
 *     CENTS, never dollars. Rate columns are `integer` and hold MilliRate —
 *     ten-thousandths of a dollar (ENGINE.md §2). Hours columns are `integer` and
 *     hold hundredths of an hour. There is no `numeric` money column and no float
 *     anywhere in this schema. `src/lib/money.ts` owns the conversions.
 *
 *  2. TENANT == ACCOUNT. Every tenant-scoped table carries `account_id` and is
 *     under an RLS policy keyed on `ratepin_current_account()`. The mirror carries
 *     no account column at all: it is global, contains no customer data, and is
 *     protected instead by having no UPDATE grant (I5).
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  char,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgMaterializedView,
  pgTable,
  pgView,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// `bytea` — every hash in this system is 32 raw bytes, not 64 hex characters.
// Storing hex would double the bytes and invite a case-sensitivity bug on the one
// value the eighteen-month provenance walkthrough turns on (CORPUS_DESIGN §8.3).
// ---------------------------------------------------------------------------
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const cents = (name: string) => bigint(name, { mode: 'number' });

// ===========================================================================
// ENUMS
// ===========================================================================

/** AS-2 / ENGINE §7.0. No DEFAULT at any layer; `unknown` is the refusing value. */
export const contractValueBandEnum = pgEnum('contract_value_band', [
  'over_100k',
  'at_or_under_100k',
  'unknown',
]);

export const accountStatusEnum = pgEnum('account_status', [
  'active',
  'restricted',
  'cancelled',
  'deleted',
]);
export const membershipRoleEnum = pgEnum('membership_role', ['owner', 'admin', 'member']);
export const wh347LayoutEnum = pgEnum('wh347_layout', ['wh347_rev_2025_01', 'wh347_legacy']);
export const freshnessStateEnum = pgEnum('freshness_state', ['FRESH', 'DATED', 'STALE']);

/** ARCHITECTURE §6.3 — exactly three members, one construction path. */
export const artifactStatusEnum = pgEnum('artifact_status', [
  'CERTIFIABLE',
  'CERTIFIABLE_DATED',
  'DRAFT_NOT_CERTIFIABLE',
]);

export const filingStateEnum = pgEnum('filing_state', [
  'DRAFT',
  'RELEASED',
  'AMENDED',
  'SUPERSEDED',
  'VOID',
]);
export const artifactKindEnum = pgEnum('artifact_kind', [
  'wh347_pdf',
  'statement_of_compliance',
  'ecpr_xml',
  'exception_report',
  'portal_bundle',
  'rate_card',
]);
export const artifactPiiClassEnum = pgEnum('artifact_pii_class', ['non_pii', 'ssn_bearing']);

export const blockReasonEnum = pgEnum('block_reason', [
  'UNMAPPED_TRADE',
  'UNMAPPED_DEDUCTION',
  'UNPARSED_CLASSIFICATION',
  'UNION_GROUP_REFUSED',
  'SUPERSEDED_PIN_UNCONFIRMED',
  'MISSING_REQUIRED_FIELD',
  'CWHSSA_COVERAGE_UNDETERMINED',
  'AMBIGUOUS_RATE_BASIS',
  'UNSPLIT_CLASSIFICATION_TIME',
  'PREMIUM_HOURS_UNPROVEN',
  'NET_RECONCILIATION_FAILED',
  'NO_PINNED_REVISION',
  'CORPUS_STALE_NO_NEW_ASSERTION',
  'COUNTY_SCOPE_UNRESOLVED',
  'XSD_HASH_MISMATCH',
]);

export const violationFlagEnum = pgEnum('violation_flag', [
  'WD_UNDERPAYMENT',
  'FRINGE_BELOW_WD',
  'PREMIUM_BELOW_STATUTORY',
]);

export const lineResolutionEnum = pgEnum('line_resolution', ['pending', 'resolved', 'blocked']);

/** ENGINE.md §9.1 is the single authority: 29 CFR 3.5 has TEN paragraphs, (a)-(j). */
export const deductionCategoryEnum = pgEnum('deduction_category', [
  'STATUTORY',
  'BONA_FIDE_PREPAYMENT',
  'COURT_PROCESS',
  'BENEFIT_FUND',
  'CREDIT_UNION',
  'GOVERNMENTAL',
  'CHARITABLE_501C3',
  'UNION_DUES',
  'BOARD_LODGING_FACILITIES',
  'SAFETY_EQUIPMENT',
  'UNMAPPED',
]);

export const ladderLevelEnum = pgEnum('ladder_level', [
  'L0_NORMAL',
  'L1_DATED',
  'L2_STALE',
  'L3_QUARANTINE',
  'L4_XML_BLOCKED',
  'L5_RELEASE_FROZEN',
]);

export const classificationLevelEnum = pgEnum('classification_level', [
  'L_A',
  'L_B',
  'L_C1',
  'L_C2',
  'L_D',
  'L_E',
  'L_F',
]);

export const agreementStateEnum = pgEnum('agreement_state', [
  'agreed',
  'advisory_variance',
  'blocking_variance',
  'single_path',
]);
export const parseStateEnum = pgEnum('parse_state', ['unparsed', 'parsed', 'partial', 'quarantined']);
export const identifierKindEnum = pgEnum('identifier_kind', [
  'union',
  'union_average',
  'survey',
  'state_adopted',
  'supplemental',
  'unrecognised',
]);
export const fringeTreatmentEnum = pgEnum('fringe_treatment', [
  'wd_aggregate',
  'wd_aggregate_cba_schedule_unpublished',
  'wd_aggregate_state_adopted',
  'unresolved',
]);
export const diffKindEnum = pgEnum('diff_kind', [
  'added',
  'removed',
  'rate_changed',
  'fringe_changed',
  'both_changed',
  'identifier_changed',
  'renamed',
  'unchanged',
]);
export const matchTierEnum = pgEnum('match_tier', ['exact', 'fuzzy_in_identifier', 'unmatched']);
export const scopeSourceEnum = pgEnum('scope_source', ['prose', 'index', 'doc_structured']);
export const snapshotStateEnum = pgEnum('snapshot_state', [
  'open',
  'indexed',
  'fetched',
  'parsed',
  'reconciled',
  'canaried',
  'promoted',
  'held',
  'superseded',
  'rolled_back',
]);
export const probeIdEnum = pgEnum('probe_id', ['count', 'alias', 'content_hash', 'publisher_revision']);
export const probeResultEnum = pgEnum('probe_result', ['pass', 'warn', 'fail', 'freeze']);
export const edgeSourceEnum = pgEnum('edge_source', [
  'onet_alternate_title',
  'onet_occupation',
  'string_similarity',
  'customer_correction',
  'operator_seed',
]);
export const crosswalkProvenanceEnum = pgEnum('crosswalk_provenance', [
  'deterministic',
  'llm_ranked',
  'user_confirmed',
]);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'unpaid',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'paused',
]);
export const entitlementStateEnum = pgEnum('entitlement_state', [
  'full',
  'restricted',
  'export_only',
  'none',
]);
export const jobStateEnum = pgEnum('job_state', ['ready', 'claimed', 'done', 'failed', 'dead']);
export const payrollImportStateEnum = pgEnum('payroll_import_state', [
  'open',
  'mapped',
  'resolving',
  'computed',
  'filed',
  'expired',
]);
export const inboundClassEnum = pgEnum('inbound_class', [
  'human',
  'spf_dkim_fail',
  'list_unsubscribe',
  'known_bulk',
]);
export const gateStateEnum = pgEnum('gate_state', ['locked', 'measuring', 'unlocked', 'regressed']);

// ===========================================================================
// IDENTITY AND TENANCY
// ===========================================================================

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  status: accountStatusEnum('status').notNull().default('active'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  createdAt: ts('created_at').notNull().defaultNow(),
  deletionRequestedAt: ts('deletion_requested_at'),
  deletedAt: ts('deleted_at'),
  /** Destroying this is what makes residual ciphertext in a backup undecryptable. */
  dataKeyUri: text('data_key_uri'),
  dataKeyDestroyedAt: ts('data_key_destroyed_at'),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
    deletedAt: ts('deleted_at'),
  },
  (t) => [uniqueIndex('users_email_key').on(t.email)],
);

export const memberships = pgTable(
  'memberships',
  {
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('member'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.userId] }), index('memberships_user').on(t.userId)],
);

// ===========================================================================
// THE MIRROR — global, append-only, bitemporal, no customer data
// ===========================================================================

export const wdBlob = pgTable('wd_blob', {
  blobSha256: bytea('blob_sha256').primaryKey(),
  byteLength: integer('byte_length').notNull(),
  mediaType: text('media_type').notNull(),
  /** 'A' index · 'B' document · 'C' archive. Two SEPARATE failure domains (ADR-004). */
  ingestPath: char('ingest_path', { length: 1 }).notNull(),
  sourceUrl: text('source_url').notNull(),
  fetchedAt: ts('fetched_at').notNull(),
  httpStatus: smallint('http_status').notNull(),
  responseHeaders: jsonb('response_headers').notNull().default(sql`'{}'::jsonb`),
  content: bytea('content').notNull(),
});

export const wdRevision = pgTable(
  'wd_revision',
  {
    wdNumber: text('wd_number').notNull(),
    revision: smallint('revision').notNull(),

    stateCode: char('state_code', { length: 2 }),
    wdYear: smallint('wd_year').notNull(),
    shortName: text('short_name'),
    sequenceNo: smallint('sequence_no'),

    /** Valid time: when the determination governed work in the world. */
    publishDate: date('publish_date').notNull(),
    headerDate: date('header_date').notNull(),
    supersededOn: date('superseded_on'),
    isActiveUpstream: boolean('is_active_upstream').notNull(),

    /** System time: when Ratepin first held these bytes. */
    firstSeenAt: ts('first_seen_at').notNull().defaultNow(),
    lastConfirmedAt: ts('last_confirmed_at').notNull().defaultNow(),

    canonicalSha256: bytea('canonical_sha256').notNull(),
    canonicalLength: integer('canonical_length').notNull(),
    blobASha256: bytea('blob_a_sha256').references(() => wdBlob.blobSha256),
    blobBSha256: bytea('blob_b_sha256').references(() => wdBlob.blobSha256),
    blobCSha256: bytea('blob_c_sha256').references(() => wdBlob.blobSha256),

    modTable: jsonb('mod_table').notNull(),
    modTableRows: smallint('mod_table_rows').notNull(),
    modTableFirst: smallint('mod_table_first').notNull(),
    modTableLast: smallint('mod_table_last').notNull(),

    agreement: agreementStateEnum('agreement').notNull(),
    varianceDetail: jsonb('variance_detail').notNull().default(sql`'[]'::jsonb`),
    parseStatus: parseStateEnum('parse_status').notNull().default('unparsed'),
    parseVersion: integer('parse_version').notNull().default(0),
    classCount: integer('class_count'),

    /** Stored and NEVER read. See the DDL: a column with a write path and no consumer. */
    standardIndex: boolean('standard_index'),
    standardDocument: boolean('standard_document'),
    constructionTypes: text('construction_types').array().notNull().default(sql`'{}'`),
  },
  (t) => [
    primaryKey({ columns: [t.wdNumber, t.revision] }),
    index('wd_revision_state_idx').on(t.stateCode, t.publishDate),
    index('wd_revision_canon_idx').on(t.canonicalSha256),
    index('wd_revision_pubdate_idx').on(t.publishDate),
  ],
);

export const wdAlias = pgTable(
  'wd_alias',
  {
    alias: text('alias').notNull(),
    wdNumber: text('wd_number').notNull(),
    source: text('source').notNull().default('index.allReferenceNumbers'),
    firstSeenAt: ts('first_seen_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.alias, t.wdNumber] }), index('wd_alias_lookup').on(t.alias)],
);

export const wdIndexRecord = pgTable(
  'wd_index_record',
  {
    snapshotId: bigint('snapshot_id', { mode: 'number' }).notNull(),
    wdNumber: text('wd_number').notNull(),
    revision: smallint('revision').notNull(),
    publishDate: date('publish_date'),
    modifiedDate: ts('modified_date'),
    isActive: boolean('is_active').notNull(),
    isStandard: boolean('is_standard'),
    constructionTypes: text('construction_types').array().notNull().default(sql`'{}'`),
    counties: jsonb('counties').notNull().default(sql`'[]'::jsonb`),
    indexAlias: text('index_alias'),
  },
  (t) => [primaryKey({ columns: [t.snapshotId, t.wdNumber] })],
);

export const wdClassification = pgTable(
  'wd_classification',
  {
    wdNumber: text('wd_number').notNull(),
    revision: smallint('revision').notNull(),
    ordinal: integer('ordinal').notNull(),

    rateIdentifier: text('rate_identifier').notNull(),
    identifierKind: identifierKindEnum('identifier_kind').notNull(),
    identifierDate: date('identifier_date'),

    className: text('class_name').notNull(),
    classNameRaw: text('class_name_raw').notNull(),
    classNameNorm: text('class_name_norm').notNull(),

    /** MilliRate: ten-thousandths of a dollar. Never numeric, never a float. */
    baseRateMilli: integer('base_rate_milli').notNull(),
    fringeRateMilli: integer('fringe_rate_milli').notNull(),
    fringeTreatment: fringeTreatmentEnum('fringe_treatment').notNull(),

    sourceLineStart: integer('source_line_start').notNull(),
    sourceLineEnd: integer('source_line_end').notNull(),
    sourceSha256: bytea('source_sha256').notNull(),
    /** IN the primary key: a re-derivation adds a generation, never replaces one. */
    parserVersion: integer('parser_version').notNull(),
    wrapped: boolean('wrapped').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.wdNumber, t.revision, t.parserVersion, t.ordinal] }),
    uniqueIndex('wdc_class_unique').on(
      t.wdNumber,
      t.revision,
      t.parserVersion,
      t.classNameNorm,
      t.rateIdentifier,
    ),
  ],
);

export const wdParseResidue = pgTable(
  'wd_parse_residue',
  {
    wdNumber: text('wd_number').notNull(),
    revision: smallint('revision').notNull(),
    lineStart: integer('line_start').notNull(),
    lineEnd: integer('line_end').notNull(),
    rawText: text('raw_text').notNull(),
    reason: text('reason').notNull(),
    parserVersion: integer('parser_version').notNull(),
  },
  (t) => [primaryKey({ columns: [t.wdNumber, t.revision, t.lineStart, t.parserVersion] })],
);

export const wdClassDiff = pgTable(
  'wd_class_diff',
  {
    wdNumber: text('wd_number').notNull(),
    revFrom: smallint('rev_from').notNull(),
    revTo: smallint('rev_to').notNull(),

    classNameNorm: text('class_name_norm').notNull(),
    kind: diffKindEnum('kind').notNull(),
    matchedBy: matchTierEnum('matched_by').notNull(),

    identifierFrom: text('identifier_from'),
    identifierTo: text('identifier_to'),
    baseFromMilli: integer('base_from_milli'),
    baseToMilli: integer('base_to_milli'),
    fringeFromMilli: integer('fringe_from_milli'),
    fringeToMilli: integer('fringe_to_milli'),

    /** Generated in the database. The model NEVER computes a delta (D6). */
    baseDeltaMilli: integer('base_delta_milli').generatedAlwaysAs(
      sql`(base_to_milli - base_from_milli)`,
    ),
    fringeDeltaMilli: integer('fringe_delta_milli').generatedAlwaysAs(
      sql`(fringe_to_milli - fringe_from_milli)`,
    ),
    totalDeltaMilli: integer('total_delta_milli').generatedAlwaysAs(
      sql`((base_to_milli + fringe_to_milli) - (base_from_milli + fringe_from_milli))`,
    ),

    computedAt: ts('computed_at').notNull().defaultNow(),
    parserVersion: integer('parser_version').notNull(),
  },
  (t) => [primaryKey({ columns: [t.wdNumber, t.revFrom, t.revTo, t.classNameNorm] })],
);

export const wdCountyScope = pgTable('wd_county_scope', {
  scopeId: bigserial('scope_id', { mode: 'number' }).primaryKey(),
  wdNumber: text('wd_number').notNull(),
  revision: smallint('revision').notNull(),
  source: scopeSourceEnum('source').notNull(),
  countyName: text('county_name'),
  countyNameNorm: text('county_name_norm'),
  countyCode: integer('county_code'),
  /** Parsed from the prose asterisk, never stripped: an independent city is not
   *  inside the county it adjoins, and the wrong rate follows if it is. */
  independentCity: boolean('independent_city').notNull().default(false),
  statewide: boolean('statewide').notNull().default(false),
  stateCode: char('state_code', { length: 2 }).notNull(),
});

export const wdCountyResolved = pgTable(
  'wd_county_resolved',
  {
    wdNumber: text('wd_number').notNull(),
    revision: smallint('revision').notNull(),
    stateCode: char('state_code', { length: 2 }).notNull(),
    countyNameNorm: text('county_name_norm').notNull(),
    countyName: text('county_name').notNull(),
    independentCity: boolean('independent_city').notNull(),
    countyCode: integer('county_code'),
    agreedWithIndex: boolean('agreed_with_index').notNull(),
  },
  (t) => [primaryKey({ columns: [t.wdNumber, t.revision, t.countyNameNorm] })],
);

export const corpusSnapshot = pgTable('corpus_snapshot', {
  snapshotId: bigserial('snapshot_id', { mode: 'number' }).primaryKey(),
  snapshotRef: text('snapshot_ref').notNull().unique(),
  state: snapshotStateEnum('state').notNull().default('open'),

  startedAt: ts('started_at').notNull().defaultNow(),
  promotedAt: ts('promoted_at'),
  supersededAt: ts('superseded_at'),

  /** RFC 6962-shaped Merkle root over every promoted determination text. */
  merkleRoot: bytea('merkle_root'),
  wdRevisionCount: integer('wd_revision_count'),
  classificationCount: integer('classification_count'),
  activeWdCount: integer('active_wd_count'),

  indexAlias: text('index_alias'),
  indexTotalActive: integer('index_total_active'),
  indexTotalAll: integer('index_total_all'),
  indexIndexedDate: ts('index_indexed_date'),

  newRevisions: integer('new_revisions').notNull().default(0),
  blockingVariances: integer('blocking_variances').notNull().default(0),
  quarantined: integer('quarantined').notNull().default(0),

  probeResults: jsonb('probe_results').notNull().default(sql`'{}'::jsonb`),
  goldenSuitePass: boolean('golden_suite_pass'),
  goldenSuiteLines: integer('golden_suite_lines'),
  holdReason: text('hold_reason'),
});

export const snapshotMember = pgTable(
  'snapshot_member',
  {
    snapshotId: bigint('snapshot_id', { mode: 'number' })
      .notNull()
      .references(() => corpusSnapshot.snapshotId),
    leafIndex: integer('leaf_index').notNull(),
    wdNumber: text('wd_number').notNull(),
    revision: smallint('revision').notNull(),
    leafHash: bytea('leaf_hash').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.snapshotId, t.leafIndex] }),
    unique('snapshot_member_snapshot_id_wd_number_revision_key').on(
      t.snapshotId,
      t.wdNumber,
      t.revision,
    ),
  ],
);

/** CORPUS_DESIGN §9.5 tier 3. Recorded, reported, NEVER blocking, never shown. */
export const advisoryVariance = pgTable(
  'advisory_variance',
  {
    varianceId: bigserial('variance_id', { mode: 'number' }).primaryKey(),
    snapshotId: bigint('snapshot_id', { mode: 'number' }).references(() => corpusSnapshot.snapshotId),
    wdNumber: text('wd_number').notNull(),
    revision: smallint('revision').notNull(),
    field: text('field').notNull(),
    valuePathA: text('value_path_a'),
    valuePathB: text('value_path_b'),
    valuePathC: text('value_path_c'),
    valuePathD: text('value_path_d'),
    detail: jsonb('detail').notNull().default(sql`'{}'::jsonb`),
    observedAt: ts('observed_at').notNull().defaultNow(),
  },
  (t) => [index('advisory_variance_wd').on(t.wdNumber, t.revision)],
);

export const probeRun = pgTable(
  'probe_run',
  {
    probeRunId: bigserial('probe_run_id', { mode: 'number' }).primaryKey(),
    snapshotId: bigint('snapshot_id', { mode: 'number' }).references(() => corpusSnapshot.snapshotId),
    probe: probeIdEnum('probe').notNull(),
    result: probeResultEnum('result').notNull(),
    observed: jsonb('observed').notNull(),
    expected: jsonb('expected').notNull(),
    deltaPct: numeric('delta_pct', { precision: 7, scale: 4 }),
    detail: text('detail'),
    ranAt: ts('ran_at').notNull().defaultNow(),
  },
  (t) => [index('probe_run_recent').on(t.probe, t.ranAt)],
);

export const corpusFreeze = pgTable('corpus_freeze', {
  freezeId: bigserial('freeze_id', { mode: 'number' }).primaryKey(),
  openedAt: ts('opened_at').notNull().defaultNow(),
  closedAt: ts('closed_at'),
  probe: probeIdEnum('probe').notNull(),
  probeRunId: bigint('probe_run_id', { mode: 'number' })
    .notNull()
    .references(() => probeRun.probeRunId),
  bannerText: text('banner_text').notNull(),
  suppressNewAssertions: boolean('suppress_new_assertions').notNull().default(true),
  /** There is no manual clear: a manual clear is a human minute (A6). */
  autoClosed: boolean('auto_closed').notNull().default(false),
});

/** CORPUS_DESIGN §10.6. No probe blocks without a measured red rate recorded here. */
export const blockingProbeRegister = pgTable('blocking_probe_register', {
  probeKey: text('probe_key').primaryKey(),
  specSection: text('spec_section').notNull(),
  blockingPower: text('blocking_power').notNull(),
  /** NULL is an honest blank, not an absent row. */
  redRatePct: numeric('red_rate_pct', { precision: 6, scale: 3 }),
  sampleSize: integer('sample_size'),
  measuredOn: date('measured_on'),
  armed: boolean('armed').notNull().default(false),
  withdrawn: boolean('withdrawn').notNull().default(false),
  withdrawnReason: text('withdrawn_reason'),
  note: text('note'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const obligationChangelog = pgTable(
  'obligation_changelog',
  {
    changeId: bigserial('change_id', { mode: 'number' }).primaryKey(),
    cfrTitle: smallint('cfr_title').notNull(),
    part: text('part').notNull(),
    section: text('section').notNull(),
    amendmentDate: date('amendment_date').notNull(),
    observedAt: ts('observed_at').notNull().defaultNow(),
    sourceUrl: text('source_url').notNull(),
    summary: text('summary'),
    detail: jsonb('detail').notNull().default(sql`'{}'::jsonb`),
  },
  (t) => [
    unique('obligation_changelog_cfr_title_part_section_amendment_date_key').on(
      t.cfrTitle,
      t.part,
      t.section,
      t.amendmentDate,
    ),
  ],
);

/** A regulatory figure is a corpus value with an effective date, never a constant. */
export const regulatoryConstant = pgTable(
  'regulatory_constant',
  {
    key: text('key').notNull(),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    valueCents: cents('value_cents'),
    valueText: text('value_text'),
    sourceUrl: text('source_url').notNull(),
    observedAt: ts('observed_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.key, t.effectiveFrom] })],
);

// ===========================================================================
// PROJECTS AND PINS
// ===========================================================================

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),

    stateCode: char('state_code', { length: 2 }).notNull(),
    countyName: text('county_name').notNull(),
    countyNameNorm: text('county_name_norm').notNull(),
    constructionType: text('construction_type').notNull(),
    fundingSource: text('funding_source').notNull(),
    awardDate: date('award_date'),
    primeName: text('prime_name'),
    contractNumber: text('contract_number'),

    /**
     * REQUIRED, AND DELIBERATELY WITHOUT `.default()`. Do not add one. Both
     * guesses are harmful on a document signed under 18 U.S.C. 1001: `over_100k`
     * computes a premium that is not owed, `at_or_under_100k` deletes a real
     * obligation. `unknown` is the refusing value and yields P-B.
     */
    contractValueBand: contractValueBandEnum('contract_value_band').notNull(),
    bandAssertedAt: ts('band_asserted_at').notNull(),
    bandAssertedBy: uuid('band_asserted_by')
      .notNull()
      .references(() => users.id),

    /** The customer's own assertion about their own subcontract (CORPUS_DESIGN §5.5). */
    wdRevisionLockedAtAward: boolean('wd_revision_locked_at_award'),
    lockAssertedAt: ts('lock_asserted_at'),

    /**
     * The California transmittal's contractor block (USER_JOURNEY §10). Nullable
     * with no default in either layer: "we can't get either for you — the first is
     * yours, the second is theirs", and a defaulted FEIN or PWCR is a wrong one on
     * somebody's certified payroll. Absence blocks the XML with the field named and
     * leaves the WH-347 untouched (§10.2).
     */
    dirProjectId: text('dir_project_id'),
    contractorPwcr: text('contractor_pwcr'),
    contractorFein: text('contractor_fein'),
    /** One of the pinned XSD's three `licenseTypeType` values; CHECKed in the DDL. */
    caLicenseType: text('ca_license_type'),
    caLicenseNumber: text('ca_license_number'),
    contractorAddress: text('contractor_address'),
    contractorCity: text('contractor_city'),
    contractorState: char('contractor_state', { length: 2 }),
    contractorZip: text('contractor_zip'),
    wh347Layout: wh347LayoutEnum('wh347_layout').notNull().default('wh347_rev_2025_01'),
    workweekStartDay: smallint('workweek_start_day').notNull().default(0),

    createdAt: ts('created_at').notNull().defaultNow(),
    archivedAt: ts('archived_at'),
  },
  (t) => [index('projects_account').on(t.accountId, t.createdAt)],
);

export const projectBandEvents = pgTable(
  'project_band_events',
  {
    eventId: bigserial('event_id', { mode: 'number' }).primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    fromBand: contractValueBandEnum('from_band'),
    toBand: contractValueBandEnum('to_band').notNull(),
    assertedBy: uuid('asserted_by')
      .notNull()
      .references(() => users.id),
    assertedAt: ts('asserted_at').notNull().defaultNow(),
  },
  (t) => [index('project_band_events_project').on(t.projectId, t.assertedAt)],
);

export const wdPins = pgTable(
  'wd_pins',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    wdNumber: text('wd_number').notNull(),
    revision: smallint('revision').notNull(),
    wdPublishedDate: date('wd_published_date').notNull(),
    snapshotId: bigint('snapshot_id', { mode: 'number' })
      .notNull()
      .references(() => corpusSnapshot.snapshotId),
    pinnedAt: ts('pinned_at').notNull().defaultNow(),
    pinnedBy: uuid('pinned_by')
      .notNull()
      .references(() => users.id),
    /** Stamped whether or not anything changed: verification, not change, is the event. */
    freshnessCheckedAt: ts('freshness_checked_at'),
    freshnessState: freshnessStateEnum('freshness_state').notNull().default('STALE'),
    supersededByPinId: uuid('superseded_by_pin_id'),
  },
  (t) => [index('wd_pins_project').on(t.projectId, t.pinnedAt), index('wd_pins_wd').on(t.wdNumber, t.revision)],
);

// ===========================================================================
// WORKERS AND PAYROLL
// ===========================================================================

export const workers = pgTable(
  'workers',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    externalRef: text('external_ref'),
    lastName: text('last_name').notNull(),
    firstName: text('first_name').notNull(),
    middleInitial: char('middle_initial', { length: 1 }),
    /** The full SSN exists in exactly one column, under a per-tenant key. */
    ssnCiphertext: bytea('ssn_ciphertext'),
    ssnLast4: char('ssn_last4', { length: 4 }),
    /**
     * Required by the CA eCPR schema, deleted from the Rev. January 2025 WH-347, so
     * it is underivable from the federal path. `null` means the account does not
     * hold it — that worker is ineligible for the XML and is named. Never zero by
     * default: zero is an assertion about someone's tax situation.
     */
    numWithholdingExemp: integer('num_withholding_exemp'),
    keyVersion: integer('key_version').notNull().default(1),
    createdAt: ts('created_at').notNull().defaultNow(),
    ssnPurgedAt: ts('ssn_purged_at'),
  },
  (t) => [index('workers_account').on(t.accountId)],
);

export const payrollImports = pgTable(
  'payroll_imports',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    uploadedAt: ts('uploaded_at').notNull().defaultNow(),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
    /** Duplicate uploads are detected by hash, not by filename. */
    sourceSha256: bytea('source_sha256').notNull(),
    byteSize: integer('byte_size').notNull(),
    r2Key: text('r2_key'),
    columnMap: jsonb('column_map').notNull().default(sql`'{}'::jsonb`),
    rowCount: integer('row_count').notNull().default(0),
    state: payrollImportStateEnum('state').notNull().default('open'),
  },
  (t) => [index('payroll_imports_account').on(t.accountId, t.uploadedAt)],
);

export const payrollWeeks = pgTable(
  'payroll_weeks',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    importId: uuid('import_id').references(() => payrollImports.id, { onDelete: 'set null' }),
    /** From the CSV, never from a clock (E1). */
    weekEnding: date('week_ending').notNull(),
    /** Snapshotted from the project so a regeneration eighteen months later is identical. */
    workweekStartDay: smallint('workweek_start_day').notNull(),
    contractValueBand: contractValueBandEnum('contract_value_band').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('payroll_weeks_project').on(t.projectId, t.weekEnding)],
);

export const payrollWorkerWeeks = pgTable(
  'payroll_worker_weeks',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    weekId: uuid('week_id')
      .notNull()
      .references(() => payrollWeeks.id, { onDelete: 'cascade' }),
    workerId: uuid('worker_id')
      .notNull()
      .references(() => workers.id),
    /** WH-347 column 2. */
    status: char('status', { length: 2 }).notNull(),
    apprenticeProgram: text('apprentice_program'),
    apprenticeRegistrar: char('apprentice_registrar', { length: 3 }),
    apprenticeLevel: text('apprentice_level'),
    /** Column 7B — customer-supplied, covers non-covered work too. Cents. */
    allWorkGrossCents: cents('all_work_gross_cents').notNull(),
    /** Column 9 — reconciled, never computed (ENGINE §9.3 D3). Cents. */
    netPaidCents: cents('net_paid_cents').notNull(),
  },
  (t) => [index('pww_week').on(t.weekId)],
);

export const payrollLines = pgTable(
  'payroll_lines',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    workerWeekId: uuid('worker_week_id')
      .notNull()
      .references(() => payrollWorkerWeeks.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),

    rawTitle: text('raw_title').notNull(),
    titleNorm: text('title_norm').notNull(),

    /** The branded ClassificationId, as its four mirror coordinates. */
    classWdNumber: text('class_wd_number'),
    classRevision: smallint('class_revision'),
    classParserVersion: integer('class_parser_version'),
    classOrdinal: integer('class_ordinal'),
    classNameNorm: text('class_name_norm'),
    resolvedAtLevel: classificationLevelEnum('resolved_at_level'),

    /** Seven entries each, always. Integer hundredths of an hour. */
    dayStHours: integer('day_st_hours').array().notNull(),
    dayOtHours: integer('day_ot_hours').array().notNull(),
    dayDtHours: integer('day_dt_hours').array().notNull(),

    /** MilliRate. `cashRate` is the GROSS rate — 29 CFR 5.32(a). */
    cashRateMilli: integer('cash_rate_milli').notNull(),
    cashInLieuMilli: integer('cash_in_lieu_milli').notNull().default(0),
    /** NULL IS NOT ZERO: an unproven premium is a different fact from $0.00 paid. */
    otRateMilli: integer('ot_rate_milli'),
    dtRateMilli: integer('dt_rate_milli'),

    resolutionState: lineResolutionEnum('resolution_state').notNull().default('pending'),
    blockReasons: blockReasonEnum('block_reasons').array().notNull().default(sql`'{}'`),
  },
  (t) => [
    unique('payroll_lines_worker_week_id_ordinal_key').on(t.workerWeekId, t.ordinal),
    index('payroll_lines_worker_week').on(t.workerWeekId),
  ],
);

export const payrollLineFringeCredits = pgTable(
  'payroll_line_fringe_credits',
  {
    lineId: uuid('line_id')
      .notNull()
      .references(() => payrollLines.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    planName: text('plan_name').notNull(),
    /** Customer-asserted. We print it and disclaim it; we do not verify annualization. */
    hourlyCreditMilli: integer('hourly_credit_milli').notNull(),
  },
  (t) => [primaryKey({ columns: [t.lineId, t.planName] })],
);

export const payrollWorkerDeductions = pgTable(
  'payroll_worker_deductions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    workerWeekId: uuid('worker_week_id')
      .notNull()
      .references(() => payrollWorkerWeeks.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),
    rawLabel: text('raw_label').notNull(),
    /** UNMAPPED blocks the line. It is never swept into "Other" (ENGINE §9.3 D1). */
    category: deductionCategoryEnum('category').notNull(),
    amountCents: cents('amount_cents').notNull(),
  },
  (t) => [unique('payroll_worker_deductions_worker_week_id_ordinal_key').on(t.workerWeekId, t.ordinal)],
);

// ===========================================================================
// FILINGS, ARTIFACTS AND PROVENANCE
// ===========================================================================

export const filings = pgTable(
  'filings',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    weekId: uuid('week_id').references(() => payrollWeeks.id, { onDelete: 'set null' }),
    weekEnding: date('week_ending').notNull(),
    sequence: integer('sequence').notNull().default(1),

    state: filingStateEnum('state').notNull().default('DRAFT'),
    artifactStatus: artifactStatusEnum('artifact_status').notNull(),
    blockReasons: blockReasonEnum('block_reasons').array().notNull().default(sql`'{}'`),
    violationFlags: violationFlagEnum('violation_flags').array().notNull().default(sql`'{}'`),

    pinId: uuid('pin_id').references(() => wdPins.id),
    corpusSnapshotId: bigint('corpus_snapshot_id', { mode: 'number' }).references(
      () => corpusSnapshot.snapshotId,
    ),
    engineVersion: integer('engine_version').notNull(),
    buildSha: text('build_sha').notNull(),
    xsdSha256: bytea('xsd_sha256'),
    freshnessState: freshnessStateEnum('freshness_state').notNull(),
    freshnessCheckedAt: ts('freshness_checked_at'),

    generatedAt: ts('generated_at').notNull().defaultNow(),
    releasedAt: ts('released_at'),
    amendsFilingId: uuid('amends_filing_id'),

    /**
     * R-BUILD security H-3. Inputs to the rendered bytes, so they must be stored:
     * the object store is a cache of a pure function of the stored inputs (§7.6),
     * and an input that is not stored is an artifact that cannot be rebuilt. A
     * filing generated with a signatory used to be unreproducible — every later
     * download would fail the digest comparison — which is the eighteen-months-later
     * promise broken by an omitted column.
     */
    signatoryName: text('signatory_name'),
    signatoryTitle: text('signatory_title'),
    remarks: text('remarks'),

    /** A filing our own missing input blocked is never billed (§9.5). */
    billable: boolean('billable').notNull().default(false),
  },
  (t) => [
    unique('filings_project_id_week_ending_sequence_key').on(t.projectId, t.weekEnding, t.sequence),
    index('filings_account').on(t.accountId, t.weekEnding),
  ],
);

export const artifacts = pgTable(
  'artifacts',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    filingId: uuid('filing_id')
      .notNull()
      .references(() => filings.id, { onDelete: 'cascade' }),
    kind: artifactKindEnum('kind').notNull(),
    /** I6: the sha256 IS the identity. */
    sha256: bytea('sha256').notNull(),
    r2Key: text('r2_key').notNull(),
    byteSize: integer('byte_size').notNull(),
    /** Retention is by PII class, not by file type: the eCPR XML carries full SSNs. */
    piiClass: artifactPiiClassEnum('pii_class').notNull().default('non_pii'),
    provenance: jsonb('provenance').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
    redactedAt: ts('redacted_at'),
  },
  (t) => [unique('artifacts_filing_id_kind_key').on(t.filingId, t.kind), index('artifacts_sha').on(t.sha256)],
);

/**
 * The ONLY path to a certifiable artifact. Four NOT NULL columns that cannot exist
 * for an anonymous request — `account_id`, `project_id`, `revision_pinned`,
 * `revision_at_award` — are what make the free generator structurally incapable of
 * emitting a signed-looking form (CORPUS_DESIGN §6.4).
 */
export const artifactProvenance = pgTable(
  'artifact_provenance',
  {
    artifactId: uuid('artifact_id')
      .primaryKey()
      .references(() => artifacts.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    weekEnding: date('week_ending').notNull(),
    artifactKind: artifactKindEnum('artifact_kind').notNull(),

    wdNumber: text('wd_number').notNull(),
    revisionPinned: smallint('revision_pinned').notNull(),
    revisionAtAward: smallint('revision_at_award').notNull(),
    publishDate: date('publish_date').notNull(),
    canonicalSha256: bytea('canonical_sha256').notNull(),

    snapshotId: bigint('snapshot_id', { mode: 'number' })
      .notNull()
      .references(() => corpusSnapshot.snapshotId),
    merkleRoot: bytea('merkle_root').notNull(),
    /** 14 sibling hashes for the active corpus — checkable with no Ratepin code. */
    inclusionProof: bytea('inclusion_proof').array().notNull(),
    leafIndex: integer('leaf_index').notNull(),

    corpusVerifiedAt: ts('corpus_verified_at').notNull(),
    generatedAt: ts('generated_at').notNull().defaultNow(),
    formLayout: wh347LayoutEnum('form_layout').notNull(),
    formPdfSha256: bytea('form_pdf_sha256').notNull(),
    xsdSha256: bytea('xsd_sha256'),
    engineVersion: integer('engine_version').notNull(),
    buildSha: text('build_sha').notNull(),
    contractValueBand: contractValueBandEnum('contract_value_band').notNull(),
    freshnessState: freshnessStateEnum('freshness_state').notNull(),

    certifiable: boolean('certifiable').notNull(),
    blockReasons: text('block_reasons').array().notNull().default(sql`'{}'`),
  },
  (t) => [
    index('artifact_prov_account').on(t.accountId, t.weekEnding),
    index('artifact_prov_wd').on(t.wdNumber, t.revisionPinned),
  ],
);

export const filingEvents = pgTable(
  'filing_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    filingId: uuid('filing_id')
      .notNull()
      .references(() => filings.id, { onDelete: 'cascade' }),
    at: ts('at').notNull().defaultNow(),
    kind: text('kind').notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
  },
  (t) => [index('filing_events_filing').on(t.filingId, t.at)],
);

// ===========================================================================
// THE CROSSWALK
// ===========================================================================

export const payrollTitle = pgTable('payroll_title', {
  titleNorm: text('title_norm').primaryKey(),
  firstSeenAt: ts('first_seen_at').notNull().defaultNow(),
  observationCt: integer('observation_ct').notNull().default(0),
});

export const titleSocEdge = pgTable(
  'title_soc_edge',
  {
    titleNorm: text('title_norm')
      .notNull()
      .references(() => payrollTitle.titleNorm),
    socCode: text('soc_code').notNull(),
    source: edgeSourceEnum('source').notNull(),
    weight: real('weight').notNull().default(1.0),
    addedAt: ts('added_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.titleNorm, t.socCode, t.source] })],
);

export const socWdclassEdge = pgTable('soc_wdclass_edge', {
  edgeId: bigserial('edge_id', { mode: 'number' }).primaryKey(),
  socCode: text('soc_code').notNull(),
  stateCode: char('state_code', { length: 2 }),
  constructionType: text('construction_type'),
  classNameNorm: text('class_name_norm').notNull(),
  source: edgeSourceEnum('source').notNull(),
  support: integer('support').notNull().default(0),
  refutations: integer('refutations').notNull().default(0),
  addedAt: ts('added_at').notNull().defaultNow(),
});

export const crosswalkObservation = pgTable(
  'crosswalk_observation',
  {
    observationId: bigserial('observation_id', { mode: 'number' }).primaryKey(),
    /** NOT NULL: every row is attributable (§11.6). */
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    confirmedByUserId: uuid('confirmed_by_user_id').references(() => users.id),
    /** The key includes wd_number: the same title maps differently per determination. */
    wdNumber: text('wd_number').notNull(),
    revision: smallint('revision').notNull(),
    titleNorm: text('title_norm')
      .notNull()
      .references(() => payrollTitle.titleNorm),
    titleRaw: text('title_raw').notNull(),
    chosenClassNorm: text('chosen_class_norm').notNull(),
    chosenIdentifier: text('chosen_identifier').notNull(),
    provenance: crosswalkProvenanceEnum('provenance').notNull(),

    /** What we OFFERED, so a correction is measurable rather than anecdotal. */
    offered: jsonb('offered').notNull(),
    /** NULL = the customer rejected all three. The most informative row in the table. */
    chosenRank: smallint('chosen_rank'),
    rankerVersion: integer('ranker_version').notNull(),
    resolvedAtLevel: classificationLevelEnum('resolved_at_level').notNull(),
    llmUsed: boolean('llm_used').notNull(),
    decidedAt: ts('decided_at').notNull().defaultNow(),

    eligibleForAggregate: boolean('eligible_for_aggregate').generatedAlwaysAs(
      sql`(provenance = 'user_confirmed')`,
    ),
  },
  (t) => [
    index('cw_obs_account').on(t.accountId, t.wdNumber, t.titleNorm, t.decidedAt),
    index('cw_obs_learning').on(t.titleNorm, t.chosenClassNorm),
  ],
);

// ===========================================================================
// BILLING
// ===========================================================================

export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  includedFilings: integer('included_filings'),
  overagePriceCents: integer('overage_price_cents'),
  autoUpgradeTo: text('auto_upgrade_to'),
  // No projectCap, no workerCap: ACQUISITION_REVIEW N-4 ruled the ladder has one
  // variable. See the note on the `plans` table in drizzle/0000_init.sql.
  features: jsonb('features').notNull().default(sql`'{}'::jsonb`),
});

export const subscriptions = pgTable('subscriptions', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  planId: text('plan_id').references(() => plans.id),
  status: subscriptionStatusEnum('status').notNull(),
  entitlementState: entitlementStateEnum('entitlement_state').notNull().default('none'),
  currentPeriodStart: ts('current_period_start'),
  currentPeriodEnd: ts('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const meterEvents = pgTable(
  'meter_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    filingId: uuid('filing_id')
      .notNull()
      .references(() => filings.id, { onDelete: 'cascade' }),
    stripeEventId: text('stripe_event_id'),
    at: ts('at').notNull().defaultNow(),
    quantity: integer('quantity').notNull().default(1),
    idempotencyKey: text('idempotency_key').notNull().unique(),
  },
  (t) => [uniqueIndex('meter_events_filing').on(t.filingId)],
);

export const credits = pgTable('credits', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  incidentId: bigint('incident_id', { mode: 'number' }),
  stalenessWindowId: uuid('staleness_window_id'),
  periodStart: ts('period_start'),
  cents: integer('cents').notNull(),
  reason: text('reason').notNull().default('corpus_staleness'),
  stripeBalanceTxnId: text('stripe_balance_txn_id'),
  /** Load-bearing: a Stripe balance transaction cannot be deleted, and an
   *  unattended system WILL retry. Without this we over-credit permanently. */
  idempotencyKey: text('idempotency_key').notNull().unique(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const refunds = pgTable('refunds', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  stripeRefundId: text('stripe_refund_id'),
  cents: integer('cents').notNull(),
  reasonCode: text('reason_code').notNull(),
  requestedAt: ts('requested_at').notNull().defaultNow(),
  executedAt: ts('executed_at'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
});

export const stripeEvents = pgTable('stripe_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  receivedAt: ts('received_at').notNull().defaultNow(),
  processedAt: ts('processed_at'),
  error: text('error'),
});

/** D4 / J3: purchasable BEFORE an account exists, so it cannot be account-scoped. */
export const rateCardPurchases = pgTable('rate_card_purchases', {
  id: uuid('id').primaryKey(),
  stripeSessionId: text('stripe_session_id').unique(),
  email: text('email').notNull(),
  cents: integer('cents').notNull(),
  deliveryToken: text('delivery_token').notNull().unique(),
  purchasedAt: ts('purchased_at').notNull().defaultNow(),
  expiresAt: ts('expires_at').notNull(),
  claimedByAccountId: uuid('claimed_by_account_id').references(() => accounts.id),
});

// ===========================================================================
// OPERATIONS, JOBS AND THE G1..G6 INSTRUMENTATION
// ===========================================================================

export const jobs = pgTable(
  'jobs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    kind: text('kind').notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    state: jobStateEnum('state').notNull().default('ready'),
    runAfter: ts('run_after').notNull().defaultNow(),
    claimedAt: ts('claimed_at'),
    leaseUntil: ts('lease_until'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    /** What stops a double-claim after a crash from double-billing or double-promoting. */
    idempotencyKey: text('idempotency_key').unique(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('jobs_claimable').on(t.runAfter)],
);

export const incidents = pgTable('incidents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  openedAt: ts('opened_at').notNull().defaultNow(),
  closedAt: ts('closed_at'),
  level: ladderLevelEnum('level').notNull(),
  scope: text('scope').notNull(),
  cause: text('cause').notNull(),
  /** Four values, and none of them means "notify someone" (I7). */
  autoResponse: text('auto_response').notNull(),
  detail: jsonb('detail').notNull().default(sql`'{}'::jsonb`),
});

/** G1 — rate correctness. */
export const canaryRuns = pgTable(
  'canary_runs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    at: ts('at').notNull().defaultNow(),
    buildSha: text('build_sha').notNull(),
    corpusSnapshotId: bigint('corpus_snapshot_id', { mode: 'number' }).references(
      () => corpusSnapshot.snapshotId,
    ),
    trigger: text('trigger').notNull(),
    total: integer('total').notNull(),
    passed: integer('passed').notNull(),
    distinctWds: integer('distinct_wds').notNull(),
    distinctStates: integer('distinct_states').notNull(),
    firstDivergence: jsonb('first_divergence'),
    green: boolean('green').generatedAlwaysAs(sql`(passed = total)`),
  },
  (t) => [index('canary_runs_recent').on(t.at)],
);

/** G2 — form acceptance. Unobservable from inside our system, which is why it exists. */
export const formAcceptanceConfirmations = pgTable(
  'form_acceptance_confirmations',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    filingId: uuid('filing_id')
      .notNull()
      .references(() => filings.id, { onDelete: 'cascade' }),
    artifactKind: artifactKindEnum('artifact_kind').notNull(),
    receiver: text('receiver').notNull(),
    accepted: boolean('accepted').notNull(),
    rejectionDetail: text('rejection_detail'),
    xsdSha256: bytea('xsd_sha256'),
    confirmedAt: ts('confirmed_at').notNull().defaultNow(),
    confirmedBy: uuid('confirmed_by').references(() => users.id),
  },
  (t) => [index('form_acceptance_kind').on(t.artifactKind, t.confirmedAt)],
);

/** G3 — corpus completeness. */
export const corpusReconciliation = pgTable('corpus_reconciliation', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  at: ts('at').notNull().defaultNow(),
  snapshotId: bigint('snapshot_id', { mode: 'number' }).references(() => corpusSnapshot.snapshotId),
  ourActiveCount: integer('our_active_count').notNull(),
  indexTotalActive: integer('index_total_active').notNull(),
  deltaPct: numeric('delta_pct', { precision: 7, scale: 4 }).notNull(),
  explained: boolean('explained').notNull().default(false),
  verdict: text('verdict').notNull(),
});

/** G4 — time saved. A measured median, never a DOL-derived extrapolation. */
export const filingDurations = pgTable(
  'filing_durations',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    filingId: uuid('filing_id')
      .notNull()
      .references(() => filings.id, { onDelete: 'cascade' }),
    uploadAt: ts('upload_at').notNull(),
    artifactAt: ts('artifact_at').notNull(),
    seconds: integer('seconds').notNull(),
    realFiling: boolean('real_filing').notNull().default(true),
  },
  (t) => [unique('filing_durations_filing_id_key').on(t.filingId)],
);

/** G5 — the published-address set. An undeclared mailbox fails the build. */
export const publishedAddresses = pgTable('published_addresses', {
  address: text('address').primaryKey(),
  surface: text('surface').notNull(),
  addedAt: ts('added_at').notNull().defaultNow(),
});

/** G5 — count everything, decide nothing. Anything not machine-classifiable is human. */
export const inboundMessages = pgTable(
  'inbound_messages',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    receivedAt: ts('received_at').notNull().defaultNow(),
    address: text('address')
      .notNull()
      .references(() => publishedAddresses.address),
    classification: inboundClassEnum('classification').notNull().default('human'),
    classifierRule: text('classifier_rule'),
    firstReplyAt: ts('first_reply_at'),
    /** Floored at 1: never replying must be the worst strategy, not the best. */
    minutesCharged: integer('minutes_charged').notNull().default(1),
  },
  (t) => [index('inbound_messages_recent').on(t.receivedAt)],
);

/** G6 — the chaos test that must pass before the guarantee is advertised. */
export const stalenessWindows = pgTable('staleness_windows', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  verifiedAt: ts('verified_at').notNull(),
  openedAt: ts('opened_at').notNull().defaultNow(),
  resumedAt: ts('resumed_at'),
  probe: probeIdEnum('probe'),
  chaosTest: boolean('chaos_test').notNull().default(false),
  creditId: bigint('credit_id', { mode: 'number' }).references(() => credits.id),
});

/** CORRECTIONS.md §0.2 — copy renders from the counter, never from a decision. */
export const claimGates = pgTable('claim_gates', {
  gateKey: text('gate_key').primaryKey(),
  description: text('description').notNull(),
  state: gateStateEnum('state').notNull().default('locked'),
  measuredValue: numeric('measured_value', { precision: 12, scale: 4 }),
  denominator: integer('denominator'),
  windowDays: integer('window_days'),
  consecutiveDays: integer('consecutive_days').notNull().default(0),
  unlockedAt: ts('unlocked_at'),
  evidence: jsonb('evidence').notNull().default(sql`'{}'::jsonb`),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

// ===========================================================================
// VIEWS — defined in SQL, declared here as `.existing()` so queries are typed
// ===========================================================================

/** Only the authoritative parser generation. */
export const wdClassificationCurrent = pgView('wd_classification_current', {
  wdNumber: text('wd_number').notNull(),
  revision: smallint('revision').notNull(),
  ordinal: integer('ordinal').notNull(),
  rateIdentifier: text('rate_identifier').notNull(),
  identifierKind: identifierKindEnum('identifier_kind').notNull(),
  identifierDate: date('identifier_date'),
  className: text('class_name').notNull(),
  classNameRaw: text('class_name_raw').notNull(),
  classNameNorm: text('class_name_norm').notNull(),
  baseRateMilli: integer('base_rate_milli').notNull(),
  fringeRateMilli: integer('fringe_rate_milli').notNull(),
  fringeTreatment: fringeTreatmentEnum('fringe_treatment').notNull(),
  sourceLineStart: integer('source_line_start').notNull(),
  sourceLineEnd: integer('source_line_end').notNull(),
  sourceSha256: bytea('source_sha256').notNull(),
  parserVersion: integer('parser_version').notNull(),
  wrapped: boolean('wrapped').notNull(),
}).existing();

/**
 * CORPUS_DESIGN §5.5. There is no `is_effective` column: effectiveness turns on a
 * contracting-officer finding under FAR 22.404-6 that we cannot observe, so the
 * corpus stores observable dates and declines the conclusion (P-D).
 */
export const pinStanding = pgView('pin_standing', {
  pinId: uuid('pin_id').notNull(),
  projectId: uuid('project_id').notNull(),
  accountId: uuid('account_id').notNull(),
  wdNumber: text('wd_number').notNull(),
  revisionPinned: smallint('revision_pinned').notNull(),
  revisionCurrent: smallint('revision_current').notNull(),
  currentPublishedOn: date('current_published_on').notNull(),
  pinnedSupersededOn: date('pinned_superseded_on'),
  lockedAtAward: boolean('locked_at_award'),
  standing: text('standing').notNull(),
}).existing();

/** The public lookup surface. Feeds D8 channel 2 and the free tier. */
export const countyClassRate = pgMaterializedView('county_class_rate', {
  stateCode: char('state_code', { length: 2 }).notNull(),
  countyNameNorm: text('county_name_norm').notNull(),
  countyName: text('county_name').notNull(),
  independentCity: boolean('independent_city').notNull(),
  constructionType: text('construction_type').notNull(),
  classNameNorm: text('class_name_norm').notNull(),
  className: text('class_name').notNull(),
  rateIdentifier: text('rate_identifier').notNull(),
  identifierKind: identifierKindEnum('identifier_kind').notNull(),
  baseRateMilli: integer('base_rate_milli').notNull(),
  fringeRateMilli: integer('fringe_rate_milli').notNull(),
  totalRateMilli: integer('total_rate_milli').notNull(),
  fringeTreatment: fringeTreatmentEnum('fringe_treatment').notNull(),
  wdNumber: text('wd_number').notNull(),
  revision: smallint('revision').notNull(),
  publishDate: date('publish_date').notNull(),
  canonicalSha256: bytea('canonical_sha256').notNull(),
}).existing();

/**
 * Costly-signal eligibility: four RELEASED filings across two projects is weeks of
 * real work per sybil, against a $0 magic-link signup (HIGH-2). Deliberately NOT
 * granted to the application role — it names account ids and exists only inside
 * `crosswalk_prior`'s definition.
 */
export const crosswalkEligibleAccount = pgView('crosswalk_eligible_account', {
  accountId: uuid('account_id').notNull(),
}).existing();

/**
 * AS-5 / HIGH-2: this may ORDER a candidate list and do nothing else. There is
 * deliberately no column here in which a selection could be expressed, and the
 * published value is a bucketed agreement ratio rather than a count, so the exact
 * k of a cell is not readable from any API.
 */
export const crosswalkPrior = pgMaterializedView('crosswalk_prior', {
  titleNorm: text('title_norm').notNull(),
  stateCode: char('state_code', { length: 2 }),
  constructionType: text('construction_type').notNull(),
  chosenClassNorm: text('chosen_class_norm').notNull(),
  agreementBand: integer('agreement_band'),
  asOf: ts('as_of').notNull(),
}).existing();

// ===========================================================================

export const schema = {
  accounts,
  users,
  memberships,
  wdBlob,
  wdRevision,
  wdAlias,
  wdIndexRecord,
  wdClassification,
  wdParseResidue,
  wdClassDiff,
  wdCountyScope,
  wdCountyResolved,
  corpusSnapshot,
  snapshotMember,
  advisoryVariance,
  probeRun,
  corpusFreeze,
  blockingProbeRegister,
  obligationChangelog,
  regulatoryConstant,
  projects,
  projectBandEvents,
  wdPins,
  workers,
  payrollImports,
  payrollWeeks,
  payrollWorkerWeeks,
  payrollLines,
  payrollLineFringeCredits,
  payrollWorkerDeductions,
  filings,
  artifacts,
  artifactProvenance,
  filingEvents,
  payrollTitle,
  titleSocEdge,
  socWdclassEdge,
  crosswalkObservation,
  plans,
  subscriptions,
  meterEvents,
  credits,
  refunds,
  stripeEvents,
  rateCardPurchases,
  jobs,
  incidents,
  canaryRuns,
  formAcceptanceConfirmations,
  corpusReconciliation,
  filingDurations,
  publishedAddresses,
  inboundMessages,
  stalenessWindows,
  claimGates,
  wdClassificationCurrent,
  pinStanding,
  countyClassRate,
  crosswalkEligibleAccount,
  crosswalkPrior,
} as const;

export type Schema = typeof schema;
