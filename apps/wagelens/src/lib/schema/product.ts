/**
 * CUSTOMER DATA — the tables of WL-02 … WL-08 and WL-14.
 *
 * Everything hangs off `organisations` (the platform's table): the customer is
 * the organisation, never the user. The platform owns accounts, sessions,
 * billing, email suppression, events and jobs; this file owns the product.
 *
 * TWO STRUCTURAL GUARANTEES, VISIBLE IN THE SHAPES AND ASSERTED IN CI:
 *
 *  - **Gate G7 — no column anywhere can hold a full identifying number or a
 *    home address.** `workers.identifying_no_last4` is `char(4)`; there is no
 *    `ssn`, no `address`, no `date_of_birth` column in this file. 29 CFR
 *    5.5(a)(3)(ii)(B) forbids the full number on a transmitted payroll, so the
 *    product refuses to be able to hold one. `tests/gates.test.ts` walks the
 *    generated schema and fails the build if one appears.
 *  - **A certified payroll is a signed federal statement, so everything the
 *    form prints is frozen onto the row at creation** — the worker's name, the
 *    last four, the classification label, both rates, and the pinned
 *    `(wd_number, modification_number)`. Nothing upstream may change what a
 *    signed document says.
 */

import {
  type AnyPgColumn,
  boolean,
  char,
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

import { organisations, users } from '@octopus/platform/db';

import { kbClassifications, kbWageDeterminations } from './kb';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

// ---------------------------------------------------------------------------
// WL-02 · Projects and the pin
// ---------------------------------------------------------------------------

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** WH-347 hdr.project_or_contract_no */
    projectOrContractNo: text('project_or_contract_no').notNull().default(''),
    /** WH-347 hdr.project_location */
    locationDescription: text('location_description').notNull().default(''),
    /** 'prime' | 'sub' → WH-347 hdr.role_prime / hdr.role_sub */
    ourRole: text('our_role').notNull().default('sub'),
    primeContractorName: text('prime_contractor_name'),
    awardingAgency: text('awarding_agency'),

    // --- the pin: the single most important pair of columns in the product --
    wdId: text('wd_id')
      .notNull()
      .references(() => kbWageDeterminations.id),
    /** Denormalised on purpose: it survives a corpus rebuild. */
    wdNumber: text('wd_number').notNull(),
    wdModificationNumber: integer('wd_modification_number').notNull(),
    wdPinnedAt: timestamp('wd_pinned_at', { withTimezone: true }).notNull().defaultNow(),
    wdPinnedByUserId: text('wd_pinned_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** entered_number | entered_number_and_modification | selected_from_1
     *  | selected_from_n | selected_from_history */
    wdPinMethod: text('wd_pin_method').notNull().default('entered_number'),
    /**
     * True when the pinned modification is not the active one — the 29 CFR 1.6
     * case, where the contract's modification governs the job even after DOL
     * publishes a newer one. It drives the PERMANENT, informational
     * "a newer modification (m) was published on {date}" line (WL-02 V3b), and
     * it never blocks anything. Nothing in the product ever moves a pin by
     * itself.
     */
    wdPinnedSuperseded: boolean('wd_pinned_superseded').notNull().default(false),

    // --- geography as entered (kept even when the pin came from a number) ---
    stateCode: char('state_code', { length: 2 }).notNull(),
    samCountyCode: integer('sam_county_code'),
    countyName: text('county_name'),
    /** Building | Residential | Highway | Heavy */
    constructionType: text('construction_type'),

    status: text('status').notNull().default('active'),
    contractAwardDate: date('contract_award_date'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('projects_org_status_idx').on(t.orgId, t.status),
    // WL-08 reads this: which projects are pinned to the determination that moved.
    index('projects_wd_idx').on(t.wdNumber, t.wdModificationNumber),
  ],
);

/** Never lose why a rate was what it was: a payroll certified in March under
 *  modification 1 must stay explainable in December after the project moved. */
export const projectWdPinHistory = pgTable(
  'project_wd_pin_history',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    wdNumber: text('wd_number').notNull(),
    wdModificationNumber: integer('wd_modification_number').notNull(),
    pinnedAt: timestamp('pinned_at', { withTimezone: true }).notNull().defaultNow(),
    unpinnedAt: timestamp('unpinned_at', { withTimezone: true }),
    changedByUserId: text('changed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    /** initial | accepted_modification | corrected */
    reason: text('reason').notNull().default('initial'),
  },
  (t) => [index('project_pin_history_project_idx').on(t.projectId, t.pinnedAt)],
);

// ---------------------------------------------------------------------------
// WL-04 · Workers and classification mapping
// ---------------------------------------------------------------------------

export const workers = pgTable(
  'workers',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(), // WH-347 (1C)
    lastName: text('last_name').notNull(), // WH-347 (1B)
    middleInitial: char('middle_initial', { length: 1 }), // WH-347 (1D)
    /** WH-347 (1E) — LAST FOUR DIGITS ONLY. char(4) is the guarantee, not a
     *  convention: a full number does not fit. */
    identifyingNoLast4: char('identifying_no_last4', { length: 4 }).notNull(),
    /** 'J' | 'RA' → WH-347 (2) */
    defaultStatus: text('default_status').notNull().default('J'),
    apprenticeshipProgramId: text('apprenticeship_program_id'),
    registeredClassification: text('registered_classification'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
    // THERE IS NO ssn COLUMN. THERE IS NO address COLUMN. THERE IS NO
    // date_of_birth COLUMN. Gate G7 asserts this by walking the schema in CI.
  },
  (t) => [index('workers_org_idx').on(t.orgId)],
);

/**
 * One row per worker per project. `classification_label`, `base_rate` and
 * `fringe_rate` are DENORMALISED on purpose: the payroll certified in March
 * must still print the same string and the same numbers in December, even if
 * the project later moves to a new modification. `kbClassificationId` is the
 * link back to the source; the copy is the record.
 */
export const workerClassifications = pgTable(
  'worker_classifications',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    workerId: text('worker_id')
      .notNull()
      .references(() => workers.id, { onDelete: 'cascade' }),
    /** wage_determination | conformance_pending | conformance_approved */
    source: text('source').notNull().default('wage_determination'),
    kbClassificationId: text('kb_classification_id').references(() => kbClassifications.id, {
      onDelete: 'set null',
    }),
    classificationLabel: text('classification_label').notNull(),
    baseRate: numeric('base_rate', { precision: 8, scale: 2 }).notNull(),
    fringeRate: numeric('fringe_rate', { precision: 8, scale: 2 }).notNull(),
    wdNumber: text('wd_number').notNull(),
    wdModificationNumber: integer('wd_modification_number').notNull(),
    mappedAt: timestamp('mapped_at', { withTimezone: true }).notNull().defaultNow(),
    mappedByUserId: text('mapped_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    /** History, not deletion. */
    unmappedAt: timestamp('unmapped_at', { withTimezone: true }),
  },
  (t) => [
    index('worker_classifications_project_idx').on(t.projectId),
    index('worker_classifications_worker_idx').on(t.workerId),
  ],
);

// ---------------------------------------------------------------------------
// WL-05 · Payrolls and lines
// ---------------------------------------------------------------------------

export const payrolls = pgTable(
  'payrolls',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    /** The WL-24 seam: the organisation that FILES this payroll, which is not
     *  always the organisation that owns the project once a GC rolls up subs. */
    filerOrganisationId: text('filer_organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /**
     * WH-347 hdr.certified_payroll_no. NULLABLE ON PURPOSE: allocated AT
     * CERTIFICATION, never at creation (WL-05 / WL-07, finding M4), so an
     * abandoned draft cannot leave a gap in a certified sequence — and a gap is
     * the first thing an auditor looks for.
     */
    payrollNumber: integer('payroll_number'),
    weekEndingDate: date('week_ending_date').notNull(),
    isFinal: boolean('is_final').notNull().default(false),
    noWorkPerformed: boolean('no_work_performed').notNull().default(false),
    /** draft | certified | superseded */
    status: text('status').notNull().default('draft'),
    /** Copied from the project at creation and FROZEN — never read live. A
     *  modification landing on Thursday cannot change Wednesday's draft. */
    wdNumber: text('wd_number').notNull(),
    wdModificationNumber: integer('wd_modification_number').notNull(),
    certifyingOfficialName: text('certifying_official_name'),
    certifyingOfficialTitle: text('certifying_official_title'),
    certifyingOfficialPhone: text('certifying_official_phone'),
    certifyingOfficialEmail: text('certifying_official_email'),
    additionalRemarks: text('additional_remarks'),
    certifiedAt: timestamp('certified_at', { withTimezone: true }),
    certifiedByUserId: text('certified_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    supersededByPayrollId: text('superseded_by_payroll_id').references(
      (): AnyPgColumn => payrolls.id,
      { onDelete: 'set null' },
    ),
    // WL-07 · submission status is the honour system, no portal integration.
    submissionStatus: text('submission_status').notNull().default('not_sent'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    submissionRecipient: text('submission_recipient'),
    submissionStatusNote: text('submission_status_note'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('payrolls_number_idx').on(t.projectId, t.filerOrganisationId, t.payrollNumber),
    index('payrolls_project_week_idx').on(t.projectId, t.weekEndingDate),
  ],
);

export const payrollLines = pgTable(
  'payroll_lines',
  {
    id: text('id').primaryKey(),
    payrollId: text('payroll_id')
      .notNull()
      .references(() => payrolls.id, { onDelete: 'cascade' }),
    workerId: text('worker_id')
      .notNull()
      .references(() => workers.id),
    workerEntryNo: integer('worker_entry_no').notNull(), // (1A)
    // --- frozen worker identity: the form must reproduce exactly, forever ---
    lastName: text('last_name').notNull(), // (1B)
    firstName: text('first_name').notNull(), // (1C)
    middleInitial: char('middle_initial', { length: 1 }), // (1D)
    identifyingNoLast4: char('identifying_no_last4', { length: 4 }).notNull(), // (1E)
    workerStatus: text('worker_status').notNull().default('J'), // (2)
    classificationLabel: text('classification_label').notNull(), // (3)
    kbClassificationId: text('kb_classification_id').references(() => kbClassifications.id, {
      onDelete: 'set null',
    }),
    /** (4) is a 7×2 grid; day 0 is the Sunday that starts the week ending on
     *  `week_ending_date`. A fixed-length array of 7, not a row per day: the
     *  query is always "the whole week". */
    hoursSt: numeric('hours_st', { precision: 5, scale: 2 }).array().notNull(),
    hoursOt: numeric('hours_ot', { precision: 5, scale: 2 }).array().notNull(),
    totalHoursSt: numeric('total_hours_st', { precision: 6, scale: 2 }).notNull().default('0'), // (5)
    totalHoursOt: numeric('total_hours_ot', { precision: 6, scale: 2 }).notNull().default('0'), // (5)
    rateSt: numeric('rate_st', { precision: 8, scale: 2 }).notNull(), // (6A)
    rateOt: numeric('rate_ot', { precision: 8, scale: 2 }).notNull().default('0'), // (6A)
    fringeCreditHourly: numeric('fringe_credit_hourly', { precision: 8, scale: 2 })
      .notNull()
      .default('0'), // (6B)
    paymentInLieuHourly: numeric('payment_in_lieu_hourly', { precision: 8, scale: 2 })
      .notNull()
      .default('0'), // (6C)
    grossProject: numeric('gross_project', { precision: 10, scale: 2 }).notNull().default('0'), // (7A)
    grossAllWork: numeric('gross_all_work', { precision: 10, scale: 2 }).notNull().default('0'), // (7B)
    dedTaxWithholdings: numeric('ded_tax_withholdings', { precision: 10, scale: 2 })
      .notNull()
      .default('0'), // (8a)
    dedFica: numeric('ded_fica', { precision: 10, scale: 2 }).notNull().default('0'), // (8b)
    dedOther: numeric('ded_other', { precision: 10, scale: 2 }).notNull().default('0'), // (8c)
    dedOtherNote: text('ded_other_note'),
    dedTotal: numeric('ded_total', { precision: 10, scale: 2 }).notNull().default('0'), // (8d)
    netPay: numeric('net_pay', { precision: 10, scale: 2 }).notNull().default('0'), // (9)
    /** The determination's rate at line creation, for the below-rate check. */
    wdBaseRate: numeric('wd_base_rate', { precision: 8, scale: 2 }),
    wdFringeRate: numeric('wd_fringe_rate', { precision: 8, scale: 2 }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [
    uniqueIndex('payroll_lines_entry_idx').on(t.payrollId, t.workerEntryNo),
    index('payroll_lines_order_idx').on(t.payrollId, t.sortOrder),
  ],
);

// ---------------------------------------------------------------------------
// WL-06 · Generated documents and the share link
// ---------------------------------------------------------------------------

export const documents = pgTable(
  'documents',
  {
    id: text('id').primaryKey(),
    payrollId: text('payroll_id')
      .notNull()
      .references(() => payrolls.id, { onDelete: 'cascade' }),
    /** wh347 | statement_of_compliance */
    kind: text('kind').notNull(),
    storageKey: text('storage_key').notNull(),
    byteSize: integer('byte_size').notNull(),
    sha256: char('sha256', { length: 64 }).notNull(),
    pageCount: integer('page_count').notNull().default(1),
    // --- provenance, stamped into the PDF's own footer -------------------
    wdNumber: text('wd_number').notNull(),
    wdModificationNumber: integer('wd_modification_number').notNull(),
    wdPublicationDate: date('wd_publication_date').notNull(),
    formRevision: text('form_revision').notNull().default('WH-347 Rev. January 2025'),
    ombControlNumber: text('omb_control_number').notNull().default('1235-0008'),
    generatorVersion: text('generator_version').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('documents_identity_idx').on(t.payrollId, t.kind, t.generatorVersion),
    index('documents_payroll_idx').on(t.payrollId),
  ],
);

/**
 * An UNAUTHENTICATED url that streams a document containing worker names, last
 * four digits, hours and pay. Every column below exists because of that: the
 * token is hashed, the link expires in 7 days, it is revocable, and every
 * access is counted and timestamped (finding M10). There is deliberately no
 * "permanent" or "bookmarkable" variant.
 */
export const documentShareLinks = pgTable(
  'document_share_links',
  {
    id: text('id').primaryKey(),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    tokenHash: char('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    accessedCount: integer('accessed_count').notNull().default(0),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedByUserId: text('revoked_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('document_share_links_document_idx').on(t.documentId)],
);

// ---------------------------------------------------------------------------
// WL-08 · Determination-change alerts (project-scoped, for customers)
// ---------------------------------------------------------------------------

export const wdChangeAlerts = pgTable(
  'wd_change_alerts',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    wdNumber: text('wd_number').notNull(),
    fromModification: integer('from_modification').notNull(),
    toModification: integer('to_modification').notNull(),
    /** { changed:[…], removed:[…], added:[…] } */
    diff: jsonb('diff').notNull(),
    affectedWorkerCount: integer('affected_worker_count').notNull().default(0),
    /** pending | accepted | dismissed | superseded */
    status: text('status').notNull().default('pending'),
    emailSentAt: timestamp('email_sent_at', { withTimezone: true }),
    emailOpenedAt: timestamp('email_opened_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedByUserId: text('resolved_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
  },
  (t) => [
    // The anti-spam guarantee at the database level: a re-run of the ingest job
    // cannot send a second email for the same modification.
    uniqueIndex('wd_change_alerts_identity_idx').on(t.projectId, t.wdNumber, t.toModification),
    index('wd_change_alerts_project_idx').on(t.projectId, t.status),
  ],
);

// ---------------------------------------------------------------------------
// WL-14 · The public, consented determination watch
// ---------------------------------------------------------------------------

/**
 * An email address collected on a PUBLIC page, so the consent record IS the
 * table: what wording was ticked, when, from what hashed address, and how it is
 * withdrawn. Nothing here stores an IP address or anything else we do not need.
 */
export const wdWatches = pgTable(
  'wd_watches',
  {
    id: text('id').primaryKey(),
    /** Stored normalised (trimmed, lowercased) — the same discipline as the
     *  platform's `users.email`. `citext` is not used because PGlite has no
     *  citext extension and dev/test parity is worth more than a collation. */
    email: text('email').notNull(),
    /** The DOCUMENT, not a version: a watch follows the WD number. */
    wdNumber: text('wd_number').notNull(),
    /** pending | confirmed | unsubscribed | bounced | expired */
    status: text('status').notNull().default('pending'),
    // --- the consent record ------------------------------------------------
    /** Content hash of the checkbox label that was shown and ticked. If the
     *  wording changes, the record still says what THIS person agreed to. */
    consentTextVersion: text('consent_text_version').notNull(),
    consentedAt: timestamp('consented_at', { withTimezone: true }).notNull().defaultNow(),
    /** sha256(ip + server salt). NEVER the address itself. */
    createdIpHash: char('created_ip_hash', { length: 64 }).notNull(),
    createdUserAgentHash: char('created_user_agent_hash', { length: 64 }),
    confirmTokenHash: char('confirm_token_hash', { length: 64 }).notNull().unique(),
    confirmExpiresAt: timestamp('confirm_expires_at', { withTimezone: true }).notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    confirmedIpHash: char('confirmed_ip_hash', { length: 64 }),
    /** Stable for the life of the row: it is in every message we send. */
    unsubscribeTokenHash: char('unsubscribe_token_hash', { length: 64 }).notNull().unique(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    /** determination | all */
    unsubscribeScope: text('unsubscribe_scope'),
    lastAlertSentAt: timestamp('last_alert_sent_at', { withTimezone: true }),
    alertsSentCount: integer('alerts_sent_count').notNull().default(0),
    bouncedAt: timestamp('bounced_at', { withTimezone: true }),
    /** consented_at + 18 months. Retention is a column, not a policy note. */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    // Makes a double submission idempotent and the ≤3 cap countable in one query.
    uniqueIndex('wd_watches_identity_idx').on(t.email, t.wdNumber),
    index('wd_watches_wd_idx').on(t.wdNumber, t.status),
    index('wd_watches_expiry_idx').on(t.expiresAt),
  ],
);

// ---------------------------------------------------------------------------
// WL-11 · The standing disclaimer, acknowledged once and recorded
// ---------------------------------------------------------------------------

export const disclaimerAcknowledgements = pgTable(
  'disclaimer_acknowledgements',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Content hash of /legal/disclaimer at the moment it was acknowledged. */
    disclaimerVersion: text('disclaimer_version').notNull(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('disclaimer_ack_identity_idx').on(t.userId, t.disclaimerVersion)],
);

export const productSchema = {
  projects,
  projectWdPinHistory,
  workers,
  workerClassifications,
  payrolls,
  payrollLines,
  documents,
  documentShareLinks,
  wdChangeAlerts,
  wdWatches,
  disclaimerAcknowledgements,
};

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Worker = typeof workers.$inferSelect;
export type WorkerClassification = typeof workerClassifications.$inferSelect;
export type Payroll = typeof payrolls.$inferSelect;
export type PayrollLine = typeof payrollLines.$inferSelect;
export type WdChangeAlert = typeof wdChangeAlerts.$inferSelect;
export type WdWatch = typeof wdWatches.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type DocumentShareLink = typeof documentShareLinks.$inferSelect;
