/**
 * CERTLY'S TABLES — the data model for every Must spec.
 *
 * The platform owns `organisations`, `users`, `memberships`, `sessions`,
 * billing, events and jobs; everything below is product data and hangs off
 * `organisations`, because the customer is the org and never the user.
 *
 * FOUR DECISIONS THAT ARE VISIBLE ONLY ACROSS THE WHOLE FILE:
 *
 *  1. **Ids are `text`, not `uuid`.** The specs write `uuid('id')`. The
 *     platform's `organisations.id` and `users.id` are `text` holding a
 *     prefixed ULID (`org_01j…`), and a foreign key must match its target's
 *     type. Prefixed ULIDs are also time-ordered and self-describing in a log
 *     line, which a v4 UUID is not. Recorded as deviation D-2 in BUILD.md.
 *
 *  2. **`extractions` has TWO possible owners and a CHECK that allows exactly
 *     one** (`specs/15` §5, REVIEW.md B-08). An org document and an anonymous
 *     Free Gap Report document produce the same kind of extraction, so they
 *     share one table and therefore ONE eval pipeline. The alternative —
 *     giving every gap-report session a real `organisations` row — keeps the
 *     org-scoping invariant clean at the cost of polluting every funnel query
 *     in M14, which is the instrument that decides persevere/iterate/stop.
 *
 *  3. **`raw` survives everywhere a number does.** `coverage_limits.raw` is
 *     `notNull` while `amount` is nullable, because corpus C5 prints
 *     `$100,000 SIR` and E1 prints `STATUTORY` in limit boxes. A schema that
 *     forces those to numbers produces a confident, wrong gap (`specs/03` §4).
 *
 *  4. **`audit_events` is append-only in the DATABASE**, not by convention —
 *     a rule rejects UPDATE and DELETE (`specs/09` §4). An audit trail that can
 *     be silently skipped is decoration.
 *
 * `org_settings` exists because `specs/01` §4 puts `entityBlock` and `timezone`
 * on `organisations`, which belongs to the platform and is out of scope for
 * this fleet. Recorded as platform request PR-1 in BUILD.md.
 */

import { organisations, users } from '@octopus/platform/db';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import type { CoiExtraction } from './engine';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const orgRef = () =>
  text('org_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' });

// ---------------------------------------------------------------------------
// M1 — the org's own settings (specs/01 §4, specs/13 §2)
// ---------------------------------------------------------------------------

export const orgSettings = pgTable('org_settings', {
  orgId: text('org_id')
    .primaryKey()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  /**
   * The certificate-holder block. NOT cosmetic: M5's holder match reads it, and
   * a comparison with no entity block can only ever answer `undetermined`.
   */
  entityBlock: text('entity_block'),
  /** Extra accepted holder strings — a managing agent, a lender (specs/05 §9). */
  alternateHolders: jsonb('alternate_holders').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  /** IANA zone. Every evaluation date is this org's local midnight (specs/05 §7). */
  timezone: text('timezone').notNull().default('America/New_York'),
  /** 'pm' | 'hoa' | 'gc' | 'tenant' — chosen in onboarding, picks the library. */
  audience: text('audience'),
  onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// M2 — requirement sets, requirements, vendor types (specs/02 §4)
// ---------------------------------------------------------------------------

export const requirementSets = pgTable(
  'requirement_sets',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    name: text('name').notNull(),
    audience: text('audience').notNull(),
    /** 'gc.trade.high_hazard' | null when hand-built. A COPY, never a reference. */
    sourceTemplateId: text('source_template_id'),
    sourceTemplateVersion: integer('source_template_version'),
    /** Bumped on every save; a comparison records which version it evaluated. */
    version: integer('version').notNull().default(1),
    isOrgDefault: boolean('is_org_default').notNull().default(false),
    createdBy: text('created_by').references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('requirement_sets_org_idx').on(t.orgId),
    // Exactly one default per org — a partial unique index, so a second default
    // is impossible rather than merely discouraged (specs/02 §6).
    uniqueIndex('requirement_sets_one_default')
      .on(t.orgId)
      .where(sql`${t.isOrgDefault}`),
  ],
);

export const requirements = pgTable(
  'requirements',
  {
    id: text('id').primaryKey(),
    requirementSetId: text('requirement_set_id')
      .notNull()
      .references(() => requirementSets.id, { onDelete: 'cascade' }),
    orgId: orgRef(),
    /** 'limit'|'coverage_present'|'endorsement'|'policy_condition'|'carrier' */
    kind: text('kind').notNull(),
    coverage: text('coverage'),
    limitLabel: text('limit_label'),
    minAmount: bigint('min_amount', { mode: 'number' }),
    combinable: boolean('combinable').notNull().default(false),
    endorsementKey: text('endorsement_key'),
    /** ALWAYS a list (KB §B.0) — one-form matching fails real certificates. */
    acceptsForms: jsonb('accepts_forms').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    condition: jsonb('condition').$type<Record<string, unknown>>(),
    otherLabel: text('other_label'),
    label: text('label'),
    /** 'blocking' | 'advisory' — advisory rows never mark a vendor red. */
    severity: text('severity').notNull().default('blocking'),
    note: text('note'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [
    index('requirements_set_idx').on(t.requirementSetId, t.sortOrder),
    index('requirements_org_idx').on(t.orgId),
    // A zero minimum means "do not check", which is what deleting the row is
    // for (specs/02 §6). Enforced here so a spreadsheet paste cannot smuggle
    // one past the form validator.
    check('requirements_min_amount_positive', sql`min_amount IS NULL OR min_amount > 0`),
    check('requirements_severity', sql`severity IN ('blocking','advisory')`),
  ],
);

export const vendorTypes = pgTable(
  'vendor_types',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    key: text('key').notNull(),
    label: text('label').notNull(),
    requirementSetId: text('requirement_set_id').references(() => requirementSets.id),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('vendor_types_org_key').on(t.orgId, t.key)],
);

// ---------------------------------------------------------------------------
// M3 — vendors and CSV import (specs/04 §4)
// ---------------------------------------------------------------------------

export const vendors = pgTable(
  'vendors',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    name: text('name').notNull(),
    /** Used by M5's name match when present. */
    legalName: text('legal_name'),
    vendorTypeId: text('vendor_type_id').references(() => vendorTypes.id),
    /**
     * A BUSINESS MAILBOX THE CUSTOMER TYPED IN. Certly never scrapes,
     * purchases, guesses or infers a contact address, and stores no personal
     * name for a vendor contact (PLAN.md §D5, expressed as a schema).
     */
    contactEmail: text('contact_email'),
    /** A ROLE — "office", "accounts". Never a person's name. */
    contactLabel: text('contact_label'),
    externalRef: text('external_ref'),
    /** A CACHE of M5's vendor state; never written by hand. */
    status: text('status').notNull().default('no_certificate'),
    earliestRequiredExpiry: date('earliest_required_expiry'),
    remindersPaused: boolean('reminders_paused').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // The dashboard is one indexed query rather than a join across four tables.
    index('vendors_org_status_idx').on(t.orgId, t.status),
    index('vendors_org_expiry_idx').on(t.orgId, t.earliestRequiredExpiry),
    index('vendors_org_name_idx').on(t.orgId, t.name),
    // `specs/06` §4, added by M6 (migration 0002). The dashboard's counter
    // query and its table share one predicate — org, not archived, status,
    // soonest expiry — so they share one index. Added rather than folded into
    // the three above because a partial roster scan that has to re-check
    // `archived_at` is the difference between 200 ms and a sequential scan at
    // 5,000 vendors (`specs/06` §8).
    index('vendors_dashboard').on(t.orgId, t.archivedAt, t.status, t.earliestRequiredExpiry),
    // The six vendor states, mutually exclusive and exhaustive (specs/06 §3).
    // 'covered' is RETIRED and the database refuses it (REVIEW.md B-02).
    check(
      'vendors_status',
      sql`status IN ('meets','asserted_only','expiring','gap','expired','no_certificate')`,
    ),
  ],
);

export const csvImports = pgTable(
  'csv_imports',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    userId: text('user_id').references(() => users.id),
    filename: text('filename').notNull(),
    bytes: integer('bytes').notNull(),
    rowCount: integer('row_count').notNull().default(0),
    mapping: jsonb('mapping').$type<Record<string, string>>(),
    createdCount: integer('created_count').notNull().default(0),
    updatedCount: integer('updated_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
    status: text('status').notNull().default('parsing'),
    /** A DocumentStore key — never a URL, never bytes in Neon. */
    errorsCsvKey: text('errors_csv_key'),
    createdAt: createdAt(),
  },
  (t) => [index('csv_imports_org_idx').on(t.orgId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// M15 — the anonymous Free Gap Report (specs/15 §5)
// Declared BEFORE `extractions`, which references `gap_report_documents`.
// ---------------------------------------------------------------------------

export const gapReportSessions = pgTable(
  'gap_report_sessions',
  {
    id: text('id').primaryKey(),
    /** The URL is /gap-report/<token>; the RAW TOKEN is never stored. */
    tokenHash: text('token_hash').notNull().unique(),
    email: text('email'),
    audience: text('audience'),
    templateId: text('template_id'),
    /** The exact rows compared against — the report must be reproducible. */
    requirementsSnapshot: jsonb('requirements_snapshot'),
    documentCount: integer('document_count').notNull().default(0),
    extractedCount: integer('extracted_count').notNull().default(0),
    comparedCount: integer('compared_count').notNull().default(0),
    needsReviewCount: integer('needs_review_count').notNull().default(0),
    rejectedCount: integer('rejected_count').notNull().default(0),
    status: text('status').notNull().default('collecting'),
    reportKey: text('report_key'),
    convertedOrgId: text('converted_org_id').references(() => organisations.id),
    createdAt: createdAt(),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    /** createdAt + 7 DAYS. Tightened from 30 by REVIEW.md B-07. */
    purgeAt: timestamp('purge_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('gap_report_sessions_purge_idx').on(t.purgeAt)],
);

export const gapReportDocuments = pgTable(
  'gap_report_documents',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => gapReportSessions.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(),
    mime: text('mime').notNull(),
    bytes: integer('bytes').notNull(),
    sha256: text('sha256').notNull(),
    /** What the visitor called it — §4.1 names the file back to them. */
    originalFilename: text('original_filename'),
    insuredNameRead: text('insured_name_read'),
    status: text('status').notNull().default('uploaded'),
    /** Set INSIDE the render job: the source file does not outlive the job. */
    storageDeletedAt: timestamp('storage_deleted_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('gap_report_documents_session_idx').on(t.sessionId)],
);

// ---------------------------------------------------------------------------
// M4 — documents, extractions, certificates (specs/03 §4)
// ---------------------------------------------------------------------------

export const documents = pgTable(
  'documents',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    /** Null until matched to a vendor (SH-1's triage queue). */
    vendorId: text('vendor_id').references(() => vendors.id),
    kind: text('kind').notNull().default('coi'),
    /** A DocumentStore key, never a URL (REVIEW.md §3). */
    storageKey: text('storage_key').notNull(),
    mime: text('mime').notNull(),
    bytes: integer('bytes').notNull(),
    pageCount: integer('page_count'),
    sha256: text('sha256').notNull(),
    /** 'app' | 'link' | 'inbound' */
    source: text('source').notNull().default('app'),
    /** KB §A.4's AMS-variant experiment: the only forensic signal available. */
    pdfProducer: text('pdf_producer'),
    pdfCreator: text('pdf_creator'),
    uploadedBy: text('uploaded_by').references(() => users.id),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Dedupe per org: the same certificate uploaded twice is one document and
    // one model call, not two (specs/03 §10).
    uniqueIndex('documents_org_sha').on(t.orgId, t.sha256),
    index('documents_vendor_idx').on(t.vendorId, t.uploadedAt),
  ],
);

export const extractions = pgTable(
  'extractions',
  {
    id: text('id').primaryKey(),
    /** Null on the M15 path. */
    documentId: text('document_id').references(() => documents.id, { onDelete: 'cascade' }),
    /** Null on the org path. */
    gapReportDocumentId: text('gap_report_document_id').references(() => gapReportDocuments.id, {
      onDelete: 'cascade',
    }),
    /** Null on, and only on, the gap-report path. */
    orgId: text('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
    /** 'pending'|'running'|'needs_review'|'ready'|'rejected'|'failed' */
    status: text('status').notNull().default('pending'),
    /** Stamped, never inferred. */
    model: text('model').notNull(),
    schemaVersion: text('schema_version').notNull().default('coi.v1'),
    /** Content hash of the system prefix, so a prompt change is visible. */
    promptHash: text('prompt_hash').notNull(),
    payload: jsonb('payload').$type<CoiExtraction>(),
    docConfidence: numeric('doc_confidence', { precision: 4, scale: 3 }),
    gateFailures: integer('gate_failures').notNull().default(0),
    usage: jsonb('usage').$type<{ input: number; output: number; cacheRead: number }>(),
    costCents: numeric('cost_cents', { precision: 8, scale: 4 }),
    durationMs: integer('duration_ms'),
    failureReason: text('failure_reason'),
    createdAt: createdAt(),
  },
  (t) => [
    index('extractions_document_idx').on(t.documentId),
    index('extractions_org_status_idx').on(t.orgId, t.status),
    // EXACTLY ONE OWNER, ALWAYS (specs/15 §5, REVIEW.md B-08). Without this a
    // row could carry both owners or neither, and the security test that says
    // "no gap-report extraction is readable from an org" would have nothing to
    // stand on.
    check(
      'extractions_one_owner',
      sql`(document_id IS NOT NULL AND org_id IS NOT NULL AND gap_report_document_id IS NULL)
       OR (document_id IS NULL     AND org_id IS NULL     AND gap_report_document_id IS NOT NULL)`,
    ),
    check(
      'extractions_status',
      sql`status IN ('pending','running','needs_review','ready','rejected','failed')`,
    ),
  ],
);

export const fieldCorrections = pgTable(
  'field_corrections',
  {
    id: text('id').primaryKey(),
    extractionId: text('extraction_id')
      .notNull()
      .references(() => extractions.id, { onDelete: 'cascade' }),
    orgId: orgRef(),
    /** A JSON pointer, e.g. `/coverages/0/policy_exp`. */
    path: text('path').notNull(),
    wasValue: text('was_value'),
    wasConfidence: numeric('was_confidence', { precision: 4, scale: 3 }),
    /** 'passed'|'failed'|'skipped' — the quote gate's verdict before the edit. */
    wasGate: text('was_gate'),
    nowValue: text('now_value'),
    correctedBy: text('corrected_by')
      .notNull()
      .references(() => users.id),
    correctedAt: timestamp('corrected_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('field_corrections_extraction_idx').on(t.extractionId)],
);

export const certificates = pgTable(
  'certificates',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id),
    extractionId: text('extraction_id')
      .notNull()
      .references(() => extractions.id),
    /** '2010/05'|'2014/01'|'2016/03'|'2025/12'|'unknown'. 2025/12 is CURRENT. */
    formEdition: text('form_edition'),
    certificateDate: date('certificate_date'),
    insuredName: text('insured_name'),
    certificateHolder: text('certificate_holder'),
    /** min(policy_exp) over REQUIRED coverages — the clock the reminders run on. */
    earliestExpiry: date('earliest_expiry'),
    /** 'active' | 'superseded' */
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
  },
  (t) => [
    index('certificates_vendor_active').on(t.vendorId, t.status),
    index('certificates_org_idx').on(t.orgId),
    check('certificates_status', sql`status IN ('active','superseded')`),
  ],
);

export const certificateInsurers = pgTable(
  'certificate_insurers',
  {
    id: text('id').primaryKey(),
    certificateId: text('certificate_id')
      .notNull()
      .references(() => certificates.id, { onDelete: 'cascade' }),
    letter: text('letter').notNull(),
    name: text('name'),
    naic: text('naic'),
  },
  (t) => [index('certificate_insurers_cert_idx').on(t.certificateId)],
);

export const coverages = pgTable(
  'coverages',
  {
    id: text('id').primaryKey(),
    certificateId: text('certificate_id')
      .notNull()
      .references(() => certificates.id, { onDelete: 'cascade' }),
    insrLetter: text('insr_letter'),
    type: text('type').notNull(),
    typeLabelRaw: text('type_label_raw'),
    /** 'Y'|'N'|null — AN ASSERTION, NEVER PROOF. The whole product is here. */
    addlInsd: text('addl_insd'),
    subrWvd: text('subr_wvd'),
    policyNumber: text('policy_number'),
    policyEff: date('policy_eff'),
    policyExp: date('policy_exp'),
    formBasis: text('form_basis'),
    aggregateAppliesPer: text('aggregate_applies_per'),
    wcOfficerExcluded: text('wc_officer_excluded'),
  },
  (t) => [index('coverages_certificate_idx').on(t.certificateId)],
);

export const coverageLimits = pgTable(
  'coverage_limits',
  {
    id: text('id').primaryKey(),
    coverageId: text('coverage_id')
      .notNull()
      .references(() => coverages.id, { onDelete: 'cascade' }),
    /** The closed set; collapses to 'other' when the printed label is unlisted. */
    label: text('label').notNull(),
    /**
     * The PRINTED label, always kept (REVIEW.md MJ-18). Without it a
     * Professional-Liability or Cyber row in an OTHER: block loses the only
     * string the comparison engine can match on.
     */
    labelRaw: text('label_raw').notNull(),
    /** Null when the box is not a plain number. NEVER coerce `Excluded` to 0. */
    amount: bigint('amount', { mode: 'number' }),
    /** ALWAYS the printed characters. This is why `raw` is notNull. */
    raw: text('raw').notNull(),
  },
  (t) => [index('coverage_limits_coverage_idx').on(t.coverageId)],
);

// ---------------------------------------------------------------------------
// M5 — comparisons (specs/05 §5)
// ---------------------------------------------------------------------------

export const comparisons = pgTable(
  'comparisons',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    certificateId: text('certificate_id').references(() => certificates.id),
    requirementSetId: text('requirement_set_id').references(() => requirementSets.id),
    /** WHICH version was evaluated — a report must be reproducible. */
    requirementSetVersion: integer('requirement_set_version').notNull(),
    /** Bumped on any rule change; an exported report prints it. */
    engineVersion: text('engine_version').notNull(),
    evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).notNull().defaultNow(),
    /** The org's local date the comparison was evaluated against. */
    evaluationDate: date('evaluation_date').notNull(),
    status: text('status').notNull(),
    metCount: integer('met_count').notNull().default(0),
    gapCount: integer('gap_count').notNull().default(0),
    assertedOnlyCount: integer('asserted_only_count').notNull().default(0),
    notCheckedCount: integer('not_checked_count').notNull().default(0),
    undeterminedCount: integer('undetermined_count').notNull().default(0),
    earliestRequiredExpiry: date('earliest_required_expiry'),
    createdAt: createdAt(),
  },
  (t) => [
    index('comparisons_vendor_idx').on(t.vendorId, t.evaluatedAt),
    index('comparisons_org_idx').on(t.orgId, t.evaluatedAt),
    check(
      'comparisons_status',
      sql`status IN ('meets','asserted_only','expiring','gap','expired','no_certificate')`,
    ),
  ],
);

export const comparisonResults = pgTable(
  'comparison_results',
  {
    id: text('id').primaryKey(),
    comparisonId: text('comparison_id')
      .notNull()
      .references(() => comparisons.id, { onDelete: 'cascade' }),
    /** A requirement id, or `check:name` / `check:holder` / `check:dates`. */
    requirementId: text('requirement_id').notNull(),
    origin: text('origin').notNull().default('requirement'),
    kind: text('kind').notNull(),
    coverage: text('coverage'),
    label: text('label').notNull(),
    severity: text('severity').notNull().default('blocking'),
    /** 'met'|'gap'|'asserted_only'|'not_checked'|'undetermined' */
    state: text('state').notNull(),
    foundAmount: bigint('found_amount', { mode: 'number' }),
    foundRaw: text('found_raw'),
    foundForm: text('found_form'),
    conditional: boolean('conditional').notNull().default(false),
    explanation: text('explanation').notNull(),
    /** JSON pointers into `extractions.payload`. */
    evidence: jsonb('evidence').$type<{ path: string; raw: string | null; page: number | null }[]>(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [
    index('comparison_results_comparison_idx').on(t.comparisonId, t.sortOrder),
    // The five requirement states, and no sixth. `covered` was the first
    // draft's name for `met`; the database refuses it (REVIEW.md B-02).
    check('comparison_results_state', sql`state IN ('met','gap','asserted_only','not_checked','undetermined')`),
  ],
);

// ---------------------------------------------------------------------------
// M8 — vendor upload links (specs/08 §4). Declared before `reminders`, which
// references them.
// ---------------------------------------------------------------------------

export const uploadLinks = pgTable(
  'upload_links',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    /** SHA-256. The raw token exists only in the email. */
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    /** Null when the reminder job created it. */
    createdBy: text('created_by').references(() => users.id),
    /** 'reminder:T-30' | 'manual' */
    createdFor: text('created_for').notNull().default('manual'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    firstOpenedAt: timestamp('first_opened_at', { withTimezone: true }),
    lastOpenedAt: timestamp('last_opened_at', { withTimezone: true }),
    /** MULTI-USE BY DESIGN: a single-use link breaks the moment an agent
     *  forwards it to a colleague, which is how this actually gets done. */
    useCount: integer('use_count').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index('upload_links_vendor_idx').on(t.vendorId, t.revokedAt)],
);

// ---------------------------------------------------------------------------
// M7 — reminders and their per-recipient rows (specs/07 §7, §9)
// ---------------------------------------------------------------------------

export const reminders = pgTable(
  'reminders',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    certificateId: text('certificate_id').references(() => certificates.id),
    /**
     * How many messages this expiry's ladder will send in total. Printed in the
     * body ("message 3 of 7") and enforced by the caps in §9 — an unthrottled
     * expiry could otherwise produce twenty messages about one certificate,
     * which contradicts "one ask per vendor" in three other documents.
     */
    totalForExpiry: integer('total_for_expiry').notNull().default(0),
    /** 'T-60'|'T-30'|'T-14'|'T-7'|'T-1'|'T+1'|'T+7'|'T+14'|'T+21'|'T+28' */
    rung: text('rung').notNull(),
    expiryDate: date('expiry_date').notNull(),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('scheduled'),
    /** 'vendor' | 'producer' — and never any other kind of address. */
    recipientKind: text('recipient_kind').notNull(),
    recipientEmail: text('recipient_email').notNull(),
    messageId: text('message_id'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    skippedReason: text('skipped_reason'),
    uploadLinkId: text('upload_link_id').references(() => uploadLinks.id),
    createdAt: createdAt(),
  },
  (t) => [
    // Idempotency, and no double-send on a cron retry (specs/07 §7).
    uniqueIndex('reminders_unique_rung').on(t.vendorId, t.rung, t.expiryDate, t.recipientEmail),
    index('reminders_due_idx').on(t.status, t.scheduledFor),
    index('reminders_org_idx').on(t.orgId, t.createdAt),
    check(
      'reminders_status',
      sql`status IN ('scheduled','sending','sent','delivered','bounced','complained','cancelled','skipped')`,
    ),
    check('reminders_recipient_kind', sql`recipient_kind IN ('vendor','producer')`),
  ],
);

export const suppressions = pgTable(
  'suppressions',
  {
    id: text('id').primaryKey(),
    /** Null for a GLOBAL suppression — the statutory opt-out. */
    orgId: text('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    /** 'org' | 'global'. A global row suppresses across EVERY org. */
    scope: text('scope').notNull().default('org'),
    reason: text('reason').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('suppressions_org_email')
      .on(t.orgId, t.email)
      .where(sql`${t.scope} = 'org'`),
    uniqueIndex('suppressions_global_email')
      .on(t.email)
      .where(sql`${t.scope} = 'global'`),
    check('suppressions_scope', sql`scope IN ('org','global')`),
    check(
      'suppressions_scope_org',
      sql`(scope = 'global' AND org_id IS NULL) OR (scope = 'org' AND org_id IS NOT NULL)`,
    ),
  ],
);

/**
 * THE 72-HOUR PER-RECIPIENT INTERVAL (specs/07 §9), across every org, every
 * vendor, every property and every requirement. `UX.md` §3.3 and
 * `LANDING_SPEC.md` §5 promise it and nothing implemented it — this table is
 * the implementation, and it is deliberately keyed on the ADDRESS ALONE rather
 * than on (org, address), because the promise is to the recipient.
 */
export const recipientSends = pgTable('recipient_sends', {
  email: text('email').primaryKey(),
  lastSentAt: timestamp('last_sent_at', { withTimezone: true }).notNull(),
});

export const emailEvents = pgTable(
  'email_events',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
    messageId: text('message_id'),
    type: text('type').notNull(),
    payload: jsonb('payload'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('email_events_message_idx').on(t.messageId)],
);

// ---------------------------------------------------------------------------
// M12 — reports (specs/12 §6)
// ---------------------------------------------------------------------------

export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    createdBy: text('created_by').references(() => users.id),
    scope: jsonb('scope').$type<Record<string, unknown>>(),
    /** 'pdf' | 'csv' */
    format: text('format').notNull(),
    status: text('status').notNull().default('queued'),
    /** A DocumentStore key; downloads are signed URLs, never bytes in a body. */
    storageKey: text('storage_key'),
    bytes: integer('bytes'),
    vendorCount: integer('vendor_count').notNull().default(0),
    gapCount: integer('gap_count').notNull().default(0),
    assertedOnlyCount: integer('asserted_only_count').notNull().default(0),
    notCheckedCount: integer('not_checked_count').notNull().default(0),
    needsReviewCount: integer('needs_review_count').notNull().default(0),
    engineVersion: text('engine_version'),
    shareTokenHash: text('share_token_hash'),
    shareExpiresAt: timestamp('share_expires_at', { withTimezone: true }),
    shareRevokedAt: timestamp('share_revoked_at', { withTimezone: true }),
    generatedAt: timestamp('generated_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('reports_org_idx').on(t.orgId, t.createdAt),
    uniqueIndex('reports_share_token').on(t.shareTokenHash),
  ],
);

// ---------------------------------------------------------------------------
// M10 — recorded trial consent (specs/10 §3.1, REVIEW.md B-06)
// ---------------------------------------------------------------------------

export const trialConsents = pgTable(
  'trial_consents',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    userId: text('user_id').references(() => users.id),
    stripeCheckoutSessionId: text('stripe_checkout_session_id'),
    /** THE EXACT STRING that was rendered next to the CTA, stored verbatim. */
    disclosureText: text('disclosure_text').notNull(),
    priceId: text('price_id'),
    firstChargeAt: timestamp('first_charge_at', { withTimezone: true }),
    amountCents: integer('amount_cents'),
    shownAt: timestamp('shown_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
    userAgent: text('user_agent'),
  },
  (t) => [index('trial_consents_org_idx').on(t.orgId, t.acceptedAt)],
);

// ---------------------------------------------------------------------------
// M9 — the audit trail (specs/09 §4)
// ---------------------------------------------------------------------------

export const auditEvents = pgTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    /** 'user' | 'vendor_link' | 'system' | 'inbound' */
    actorKind: text('actor_kind').notNull(),
    actorUserId: text('actor_user_id').references(() => users.id),
    /** 'vendor upload link' | 'Certly (automatic)' — for non-user actors. */
    actorLabel: text('actor_label'),
    /** The closed set in specs/09 §5. */
    kind: text('kind').notNull(),
    subjectType: text('subject_type'),
    subjectId: text('subject_id'),
    /**
     * THE RENDERED SENTENCE, WRITTEN AT WRITE TIME. If we later change how we
     * phrase an event, history must not silently change with it — the record is
     * what was true then.
     */
    summary: text('summary').notNull(),
    /** before/after, ids, reasons — never the document bytes. */
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [
    index('audit_events_org_idx').on(t.orgId, t.createdAt),
    index('audit_events_subject_idx').on(t.orgId, t.subjectType, t.subjectId, t.createdAt),
    check('audit_events_actor_kind', sql`actor_kind IN ('user','vendor_link','system','inbound')`),
    check('audit_events_summary_length', sql`length(summary) <= 500`),
  ],
);

// ---------------------------------------------------------------------------
// M11 — onboarding state (specs/11 §5) · added by sub-wave B agent B4
// ---------------------------------------------------------------------------

/**
 * The six-step checklist, resumable and skippable.
 *
 * `activatedAt` IS WRITTEN BY THE COMPARISON PATH, NEVER BY THE UI
 * (`specs/11` §5). Activation is a fact about the data — one comparison against
 * a certificate the org uploaded, out of `needs_review` — and measuring it from
 * the screens somebody visited is how an activation metric comes to overstate
 * reality. `audience` is deliberately NOT duplicated here: it lives on
 * `org_settings`, where sub-wave A put it and where M2's library reads it.
 */
export const onboardingState = pgTable('onboarding_state', {
  orgId: text('org_id')
    .primaryKey()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  /** `{ who: true, entity: true, requirements: false, … }` — one key per step. */
  stepsCompleted: jsonb('steps_completed')
    .$type<Record<string, boolean>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  skippedAt: timestamp('skipped_at', { withTimezone: true }),
  /** Set once, by the comparison path. The activation event carries the delta. */
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  firstCertificateId: text('first_certificate_id').references(() => certificates.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// M13 — roles, invitations, preferences, deletion (specs/13 §5)
// ---------------------------------------------------------------------------

/**
 * THE PRODUCT ROLE, which is not the platform role.
 *
 * `packages/platform`'s `membership_role` enum is `owner | member` and belongs
 * to the platform, which this fleet may not modify. `specs/13` §7 needs three:
 * **owner** (billing, deletion, members), **editor** (everything operational),
 * **viewer** (read and export only). So Certly keeps its own row per member and
 * derives a default from the platform role — owner→owner, member→editor — which
 * means an org that never opens this screen behaves exactly as it did before.
 * Recorded as platform request PR-9.
 */
export const memberRoles = pgTable(
  'member_roles',
  {
    orgId: orgRef(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('editor'),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('member_roles_org_user').on(t.orgId, t.userId),
    check('member_roles_role', sql`role IN ('owner','editor','viewer')`),
  ],
);

export const invitations = pgTable(
  'invitations',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    /** Lower-cased at every write: no citext extension is enabled (specs/13 §9). */
    email: text('email').notNull(),
    role: text('role').notNull().default('editor'),
    /** SHA-256 at rest, like every other token in this codebase. */
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    invitedBy: text('invited_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('invitations_token_hash').on(t.tokenHash),
    index('invitations_org_idx').on(t.orgId, t.createdAt),
    check('invitations_role', sql`role IN ('owner','editor','viewer')`),
  ],
);

/**
 * Per-user notification switches. TWO MESSAGES HAVE NO SWITCH AND ARE NOT
 * COLUMNS HERE: the trial-ending T-3/T-1 emails (`specs/10` §3.1) and the
 * customer-facing expiry warning (`UX.md` §4.1 C4), because the Lapse Watch
 * guarantee is conditioned on our having warned (REVIEW.md MJ-19). A column
 * would be a switch, and the screen says so where the toggles would be.
 */
export const userPreferences = pgTable(
  'user_preferences',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: orgRef(),
    weeklyDigest: boolean('weekly_digest').notNull().default(true),
    reviewAlerts: boolean('review_alerts').notNull().default(true),
    bounceAlerts: boolean('bounce_alerts').notNull().default(true),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('user_preferences_user_org').on(t.userId, t.orgId)],
);

export const deletionRequests = pgTable(
  'deletion_requests',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    requestedBy: text('requested_by').references(() => users.id),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    /** +30 days, cancellable until then (`specs/13` §7). */
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (t) => [index('deletion_requests_org_idx').on(t.orgId, t.requestedAt)],
);

// ---------------------------------------------------------------------------
// M10 — the Vendor Pack add-on (specs/10 §2, §A12) · added by B4
// ---------------------------------------------------------------------------

/**
 * THE VENDOR PACK, MIRRORED HERE RATHER THAN IN THE PLATFORM'S `subscriptions`.
 *
 * `packages/platform`'s entitlement reads ONE live subscription row per
 * organisation (the newest), and `normaliseSubscription` reads
 * `items.data[0]` — one item. A Vendor Pack is a second line, so mirroring it
 * into that table would make the newest row (the add-on) answer "what plan is
 * this org on?", and the shell would show a customer who just bought fifty more
 * vendors as having none. So Certly routes pack events here, keys the row on
 * the organisation, and computes `vendorLimit = base + 50 × packQuantity`
 * itself. Recorded as platform request PR-10.
 */
export const billingAddons = pgTable(
  'billing_addons',
  {
    orgId: text('org_id')
      .primaryKey()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** 0–10 packs of 50 tracked vendors (`specs/10` §9). */
    packQuantity: integer('pack_quantity').notNull().default(0),
    packPriceId: text('pack_price_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    /** Stripe's own status for the add-on subscription. */
    status: text('status'),
    updatedAt: updatedAt(),
  },
  (t) => [check('billing_addons_pack_quantity', sql`pack_quantity BETWEEN 0 AND 10`)],
);

// ---------------------------------------------------------------------------
// M7 — the org's reminder settings (specs/07 §5) · added by sub-wave B agent B3
// ---------------------------------------------------------------------------

/**
 * A TABLE OF ITS OWN RATHER THAN FOUR COLUMNS ON `org_settings`.
 *
 * `org_settings` is sub-wave A's shared row and three sub-wave B agents are
 * editing this file at once; appending a table is a conflict-free hunk at the
 * end of the file, while widening a shared row in the middle of it is not.
 * The data is also genuinely M7's: nothing outside the reminder ladder reads
 * any of it.
 *
 * `ladder` holds the rungs this org keeps. `specs/07` §2: rungs can be
 * REMOVED, never invented — a fixed set is what keeps the copy honest and the
 * tests finite — so `parseLadder` intersects whatever is stored with the ten
 * canonical rungs rather than trusting the column.
 *
 * `replyToEmail` is the customer's own mailbox (§6 item 6), so an agent's reply
 * reaches a human who can decide. Null falls back to the org owner's address,
 * which is the same promise with one less thing to configure.
 */
export const reminderSettings = pgTable('reminder_settings', {
  orgId: text('org_id')
    .primaryKey()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  /** A subset of the ten canonical rungs, in ladder order. */
  ladder: jsonb('ladder').$type<string[]>(),
  /** The `From` display name is "{Org} via {APP_NAME}"; this overrides {Org}. */
  sendingName: text('sending_name'),
  replyToEmail: text('reply_to_email'),
  /** 1 = Monday. The weekly digest to the CUSTOMER, never to a vendor. */
  weeklyDigestDay: integer('weekly_digest_day').notNull().default(1),
  /** Kill switch for one org, distinct from `vendors.remindersPaused`. */
  paused: boolean('paused').notNull().default(false),
  updatedAt: updatedAt(),
});

export const appSchema = {
  orgSettings,
  requirementSets,
  requirements,
  vendorTypes,
  vendors,
  csvImports,
  gapReportSessions,
  gapReportDocuments,
  documents,
  extractions,
  fieldCorrections,
  certificates,
  certificateInsurers,
  coverages,
  coverageLimits,
  comparisons,
  comparisonResults,
  uploadLinks,
  reminders,
  suppressions,
  recipientSends,
  emailEvents,
  reminderSettings,
  reports,
  trialConsents,
  billingAddons,
  auditEvents,
  onboardingState,
  memberRoles,
  invitations,
  userPreferences,
  deletionRequests,
};

export type Vendor = typeof vendors.$inferSelect;
export type RequirementSetRow = typeof requirementSets.$inferSelect;
export type RequirementRow = typeof requirements.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type ExtractionRow = typeof extractions.$inferSelect;
export type ComparisonRow = typeof comparisons.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
