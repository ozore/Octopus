/**
 * THE CORPUS — `kb_*`.
 *
 * Machine-owned, rebuilt from source, and containing no customer data ever
 * (KNOWLEDGE_BASE §3.1). Two properties are structural rather than procedural,
 * and both are visible in the shapes below:
 *
 *  1. **A determination is identified by `(wd_number, modification_number)`,
 *     never by geography.** F3: 12.17% of (state, county, construction type)
 *     combinations map to more than one active determination, so geography
 *     narrows and the contract decides.
 *  2. **A determination row is written once.** There is no repository method
 *     that updates `documentText`, a rate or a fringe; a new modification is a
 *     NEW ROW and the old one gains `superseded_by` (gate G2). That is what
 *     makes a rate we showed in March still explainable in December — the
 *     property the Provenance Guarantee refunds on.
 *
 * Ids are the platform's prefixed ULIDs (`newId('wd')`), not uuids. The
 * knowledge-base document specifies `uuid PK`; text ULIDs are used instead so
 * every table in the app shares one id convention with `@octopus/platform`
 * (organisations, users, jobs are all `text`), so ids sort by creation time,
 * and so a foreign key never has to cross a type. Recorded as a deviation in
 * BUILD.md.
 */

import {
  type AnyPgColumn,
  boolean,
  char,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

/**
 * SAM's county dictionary. Keyed on `(state, code, name)` and NOT on the code:
 * SAM's codes are not FIPS and are not unique — Alaska reuses 17987 for
 * "Aleutians East" and "Aleutians West" (KNOWLEDGE_BASE KB-4).
 */
export const kbCounties = pgTable(
  'kb_counties',
  {
    stateCode: char('state_code', { length: 2 }).notNull(),
    samCountyCode: integer('sam_county_code').notNull(),
    countyName: text('county_name').notNull(),
    /** Best-effort join to FIPS, nullable by design: SAM does not publish it. */
    fipsCountyCode: char('fips_county_code', { length: 5 }),
    slug: text('slug').notNull(),
    sourceUrl: text('source_url').notNull(),
    lastVerified: timestamp('last_verified', { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.stateCode, t.samCountyCode, t.countyName] }),
    index('kb_counties_state_slug_idx').on(t.stateCode, t.slug),
  ],
);

/** IMMUTABLE per `(wd_number, modification_number)`. */
export const kbWageDeterminations = pgTable(
  'kb_wage_determinations',
  {
    id: text('id').primaryKey(),
    wdNumber: text('wd_number').notNull(),
    /** SAM calls it `revisionNumber`; the WH-347 calls it the modification
     *  number. They are the same integer. The form's word wins in our schema. */
    modificationNumber: integer('modification_number').notNull(),
    stateCode: char('state_code', { length: 2 }).notNull(),
    constructionTypes: text('construction_types').array().notNull(),
    publicationDate: date('publication_date').notNull(),
    /** Derived from the INDEX and from /history's `active` flag — never from
     *  "is this the newest row we hold" (WL-13 V10). Fetching mod 0 after mod 1
     *  must not flip mod 1 to inactive. */
    isActive: boolean('is_active').notNull(),
    isStandard: boolean('is_standard').notNull().default(false),
    /** The verbatim `document` string. The evidence, and what a re-parse runs
     *  against when the parser improves. Never normalised, never "fixed". */
    documentText: text('document_text').notNull(),
    documentSha256: char('document_sha256', { length: 64 }).notNull(),
    parserVersion: text('parser_version').notNull(),
    sourceUrl: text('source_url').notNull(),
    publicUrl: text('public_url').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    lastVerified: timestamp('last_verified', { withTimezone: true }).notNull(),
    /** Set when a NEWER modification is ingested. The old row keeps its text
     *  and its rates untouched; only this pointer and `is_active` move. */
    supersededById: text('superseded_by').references((): AnyPgColumn => kbWageDeterminations.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('kb_wd_number_mod_idx').on(t.wdNumber, t.modificationNumber),
    index('kb_wd_active_idx').on(t.stateCode, t.isActive),
    index('kb_wd_last_verified_idx').on(t.lastVerified),
  ],
);

export const kbWdCounties = pgTable(
  'kb_wd_counties',
  {
    wdId: text('wd_id')
      .notNull()
      .references(() => kbWageDeterminations.id, { onDelete: 'cascade' }),
    stateCode: char('state_code', { length: 2 }).notNull(),
    samCountyCode: integer('sam_county_code').notNull(),
    countyName: text('county_name').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.wdId, t.samCountyCode, t.countyName] }),
    // The lookup index. This is the hot path: state + county + type → candidates.
    index('kb_wd_counties_lookup_idx').on(t.stateCode, t.samCountyCode),
  ],
);

/**
 * One row per revision of a WD number, from `/history`.
 *
 * History is METADATA and is fetched eagerly (one small request, so a timeline
 * can always be drawn); a revision's 17 KB text is fetched lazily and only when
 * someone asks for it (WL-13 V11, V12). `textHeld` is how the two stay honest
 * with each other.
 */
export const kbWdModifications = pgTable(
  'kb_wd_modifications',
  {
    wdNumber: text('wd_number').notNull(),
    modificationNumber: integer('modification_number').notNull(),
    publicationDate: date('publication_date').notNull(),
    /** As `/history` reports it. */
    active: boolean('active').notNull(),
    textHeld: boolean('text_held').notNull().default(false),
    historySourceUrl: text('history_source_url').notNull(),
    historyFetchedAt: timestamp('history_fetched_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.wdNumber, t.modificationNumber] }),
    index('kb_wd_modifications_number_idx').on(t.wdNumber),
  ],
);

export const kbRateGroups = pgTable(
  'kb_rate_groups',
  {
    id: text('id').primaryKey(),
    wdId: text('wd_id')
      .notNull()
      .references(() => kbWageDeterminations.id, { onDelete: 'cascade' }),
    /** 'ELEC0716-005', 'SUTX2014-029', 'UAVG-OH-0010', 'SAME2023-007'. */
    identifier: text('identifier').notNull(),
    /** union | survey | union_average | state_adopted | supplemental */
    kind: text('kind').notNull(),
    effectiveDate: date('effective_date').notNull(),
  },
  (t) => [
    // NOT (wd_id, identifier): TX20260253 lists IRON0084-012 twice, at
    // 06/01/2017 and 06/01/2024. Both are real and both are kept.
    uniqueIndex('kb_rate_groups_identity_idx').on(t.wdId, t.identifier, t.effectiveDate),
  ],
);

/**
 * ~135,000 rows nationally. Keyed on `(wd_id, line_no)` and NOT on the label:
 * MN20260080 lists the same surveyor classification twice, distinguished only
 * by a project-value qualifier (+$760,000 at $20.02, -$760,000 at $17.02).
 * A schema keyed on the label would silently drop a rate.
 */
export const kbClassifications = pgTable(
  'kb_classifications',
  {
    id: text('id').primaryKey(),
    wdId: text('wd_id')
      .notNull()
      .references(() => kbWageDeterminations.id, { onDelete: 'cascade' }),
    rateGroupId: text('rate_group_id')
      .notNull()
      .references(() => kbRateGroups.id, { onDelete: 'cascade' }),
    /** Position in `document_text`; part of identity. */
    lineNo: integer('line_no').notNull(),
    classificationLabel: text('classification_label').notNull(),
    /** Normalised: collapsed whitespace, lowercase, no punctuation. */
    searchLabel: text('search_label').notNull(),
    tradeFamily: text('trade_family'),
    baseRate: numeric('base_rate', { precision: 8, scale: 2 }).notNull(),
    /** 0.00 when the determination prints no fringe — never null. Column 6B of
     *  the form needs a number. */
    fringeRate: numeric('fringe_rate', { precision: 8, scale: 2 }).notNull(),
    qualifier: text('qualifier'),
    footnoteText: text('footnote_text'),
    // --- provenance, on every single row (PLAN.md A10, gate G1) -----------
    wdNumber: text('wd_number').notNull(),
    modificationNumber: integer('modification_number').notNull(),
    publicationDate: date('publication_date').notNull(),
    sourceUrl: text('source_url').notNull(),
    lastVerified: timestamp('last_verified', { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex('kb_classifications_line_idx').on(t.wdId, t.lineNo),
    index('kb_classifications_search_idx').on(t.wdId, t.searchLabel),
    // Gate G4, as a constraint rather than an assertion: a rate of zero or a
    // negative fringe is a parser fault, and the database is where that fault
    // has to stop.
    check('kb_classifications_base_rate_positive', sql`${t.baseRate} > 0`),
    check('kb_classifications_fringe_non_negative', sql`${t.fringeRate} >= 0`),
  ],
);

export const kbIngestRuns = pgTable('kb_ingest_runs', {
  id: text('id').primaryKey(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  /** full | delta | backfill_history | pull */
  kind: text('kind').notNull(),
  indexRecordsSeen: integer('index_records_seen'),
  determinationsNew: integer('determinations_new'),
  determinationsChanged: integer('determinations_changed'),
  classificationsWritten: integer('classifications_written'),
  /** parsed rate lines ÷ naive rate lines; gate G3. */
  parseCoverage: numeric('parse_coverage', { precision: 6, scale: 4 }),
  /** running | ok | failed | aborted_on_gate */
  status: text('status').notNull(),
  failureReason: text('failure_reason'),
  detail: text('detail'),
});

export const kbSchema = {
  kbCounties,
  kbWageDeterminations,
  kbWdCounties,
  kbWdModifications,
  kbRateGroups,
  kbClassifications,
  kbIngestRuns,
};

export type KbWageDetermination = typeof kbWageDeterminations.$inferSelect;
export type KbClassification = typeof kbClassifications.$inferSelect;
export type KbRateGroup = typeof kbRateGroups.$inferSelect;
export type KbWdModification = typeof kbWdModifications.$inferSelect;
export type KbCounty = typeof kbCounties.$inferSelect;
export type KbIngestRun = typeof kbIngestRuns.$inferSelect;
