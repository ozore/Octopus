/**
 * StateReady's own tables. The platform owns organisations, users, memberships,
 * sessions, customers, subscriptions, stripe_events, events and jobs
 * (`packages/platform/src/db/schema.ts`); everything below is product data and
 * hangs off `organisations`, because **the customer is the organisation, never
 * the user**.
 *
 * THE TENANCY RULE (`specs/01`): every table here except the knowledge-base
 * tables carries `org_id`, and every query filters on the session's
 * organisation. `tests/schema.test.ts` walks the schema and fails the build on
 * any table that breaks it — the guard that stops a cross-tenant leak being a
 * code-review problem.
 *
 * Two constraints are in the database rather than in code, because the cost of
 * getting them wrong is a wrong date on a customer's compliance record:
 *
 *  - `deadlines_citation_ck` — a derived deadline with no citation URL cannot
 *    exist (`specs/05` invariant 1: the structural version of "sources are
 *    opened, not remembered");
 *  - `licences_holder_ck` — exactly one of entity/technician holds a licence.
 *
 * Every table this file declares is covered by a Must spec. Nothing is
 * speculative: `specs/02` (profile), `03` (roster), `04` (licences), `05`
 * (deadlines), `06` (alerts and per-recipient digests), `07` (dashboard
 * snapshots), `08` (entry packs), `09` (one-offs, trial cohort, enterprise
 * enquiries), `10` (settings, export, deletion), `11` (support), `12` (legal
 * acceptances), `14` (knowledge base and drift queue), plus the audit trail.
 */

import { organisations, users } from '@octopus/platform/db';
import { sql } from 'drizzle-orm';
import {
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

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const orgRef = () =>
  text('org_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' });

// ---------------------------------------------------------------------------
// M2 — company profile: entities, branches, trades × states (specs/02)
// ---------------------------------------------------------------------------

export const companyProfiles = pgTable('company_profiles', {
  orgId: text('org_id')
    .primaryKey()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  legalName: text('legal_name').notNull(),
  /** `1-5 | 6-20 | 21-50 | 51-100 | 100+` — the fair-use band, not a hard limit. */
  technicianCountBand: text('technician_count_band'),
  timezone: text('timezone').notNull().default('America/Chicago'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const entities = pgTable(
  'entities',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    name: text('name').notNull(),
    entityType: text('entity_type'),
    homeState: text('home_state'),
    /** Archive, never delete: licences reference entities and history is the product. */
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('entities_org_idx').on(t.orgId)],
);

export const operatingStates = pgTable(
  'operating_states',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    /** null = the whole organisation rather than one entity. */
    entityId: text('entity_id').references(() => entities.id, { onDelete: 'cascade' }),
    state: text('state').notNull(),
    trade: text('trade').notNull(),
    /** `operating | expanding | considering` — `expanding` is the Entry Pack buying signal. */
    status: text('status').notNull().default('operating'),
    createdAt: createdAt(),
  },
  (t) => [
    index('operating_states_org_idx').on(t.orgId),
    // The CROSS PRODUCT is what we store. A company can be electrical in Texas
    // and plumbing in Florida and neither of the other two combinations
    // (`specs/02` §Edge cases — the single most likely modelling mistake here).
    uniqueIndex('operating_states_unique_idx').on(t.orgId, t.entityId, t.state, t.trade),
  ],
);

// ---------------------------------------------------------------------------
// M3 — technician roster and CSV import (specs/03)
// ---------------------------------------------------------------------------

/**
 * NO PHONE NUMBER, NO HOME ADDRESS, NO DATE OF BIRTH, NO SSN. The NEVER list in
 * `BACKLOG.md` is enforced here by the ABSENCE OF THE COLUMNS, not by a policy
 * document, and `tests/schema.test.ts` asserts the absence.
 */
export const technicians = pgTable(
  'technicians',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    entityId: text('entity_id').references(() => entities.id, { onDelete: 'set null' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    /** The customer's own payroll/ID number — the preferred dedupe key. */
    employeeRef: text('employee_ref'),
    /** Optional; used only to CC them on their own licence alerts. */
    email: text('email'),
    primaryState: text('primary_state'),
    primaryTrade: text('primary_trade'),
    status: text('status').notNull().default('active'),
    externalRowHash: text('external_row_hash'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('technicians_org_status_idx').on(t.orgId, t.status),
    uniqueIndex('technicians_employee_ref_idx').on(t.orgId, t.employeeRef),
  ],
);

export const imports = pgTable(
  'imports',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    filename: text('filename').notNull(),
    rowCount: integer('row_count').notNull().default(0),
    /** `{ csvHeader: field }` — what the user confirmed, kept so a bad import is explicable. */
    mapping: jsonb('mapping').notNull().default(sql`'{}'::jsonb`),
    /** `mdy | dmy` — asked, never guessed (`UX.md` S07 step 4). */
    dateFormat: text('date_format').notNull().default('mdy'),
    created: integer('created').notNull().default(0),
    updated: integer('updated').notNull().default(0),
    skipped: integer('skipped').notNull().default(0),
    errorsCsv: text('errors_csv'),
    status: text('status').notNull().default('mapping'),
    createdAt: createdAt(),
  },
  (t) => [index('imports_org_idx').on(t.orgId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// M4 — licence records and documents (specs/04)
// ---------------------------------------------------------------------------

export const licences = pgTable(
  'licences',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    holderKind: text('holder_kind').notNull(),
    entityId: text('entity_id').references(() => entities.id, { onDelete: 'set null' }),
    technicianId: text('technician_id').references(() => technicians.id, { onDelete: 'set null' }),
    state: text('state').notNull(),
    trade: text('trade').notNull(),
    /** e.g. `tx.hvac.acr_contractor_class_a`; null when the state is not covered. */
    kbLicenceTypeId: text('kb_licence_type_id'),
    customTypeName: text('custom_type_name'),
    /** Stored VERBATIM: `TACL/A/000000/C`, `CAC1812345`, NC numeric. Normalising corrupts them. */
    licenceNumber: text('licence_number'),
    issuedOn: date('issued_on'),
    expiresOn: date('expires_on'),
    /** `entered | derived | board_verified` — visible in the UI, deliberately. */
    expirySource: text('expiry_source').notNull().default('entered'),
    ceHoursRecorded: numeric('ce_hours_recorded', { precision: 6, scale: 2 }).notNull().default('0'),
    /** Surplus hours carried in where the state allows it (NC electrical). */
    ceCarriedInHours: numeric('ce_carried_in_hours', { precision: 6, scale: 2 }).notNull().default('0'),
    /** Opens the qualifier-replacement clock (`specs/05` §Event deadlines). */
    qualifierDisassociatedOn: date('qualifier_disassociated_on'),
    status: text('status').notNull().default('active'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('licences_org_expiry_idx').on(t.orgId, t.expiresOn),
    index('licences_org_state_idx').on(t.orgId, t.state),
    check(
      'licences_holder_ck',
      sql`(${t.holderKind} = 'entity' and ${t.entityId} is not null and ${t.technicianId} is null)
          or (${t.holderKind} = 'technician' and ${t.technicianId} is not null and ${t.entityId} is null)`,
    ),
  ],
);

export const licenceDocuments = pgTable(
  'licence_documents',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    licenceId: text('licence_id')
      .notNull()
      .references(() => licences.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    /** Opaque to the app: the `DocumentStore` implementation owns its shape. */
    storageKey: text('storage_key').notNull(),
    sha256: text('sha256').notNull(),
    uploadedByUserId: text('uploaded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('licence_documents_licence_idx').on(t.licenceId)],
);

export const ceRecords = pgTable(
  'ce_records',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    licenceId: text('licence_id')
      .notNull()
      .references(() => licences.id, { onDelete: 'cascade' }),
    hours: numeric('hours', { precision: 5, scale: 2 }).notNull(),
    /** Matched against the licence type's own `subject_breakdown`, never guessed. */
    subject: text('subject'),
    /** `classroom | online | unknown` — NC electrical needs half in a classroom. */
    deliveryMode: text('delivery_mode').notNull().default('unknown'),
    provider: text('provider'),
    completedOn: date('completed_on').notNull(),
    documentId: text('document_id').references(() => licenceDocuments.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('ce_records_licence_idx').on(t.licenceId)],
);

// ---------------------------------------------------------------------------
// M5 — derived deadlines (specs/05)
// ---------------------------------------------------------------------------

/**
 * Deadlines are **immutable and superseded, never updated in place**, and each
 * pins the knowledge-base snapshot it came from. When a customer says "you told
 * me 4 June", we can show them what we knew, when, and from which version of
 * which page.
 */
export const deadlines = pgTable(
  'deadlines',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    licenceId: text('licence_id').references(() => licences.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    dueOn: date('due_on').notNull(),
    source: text('source').notNull(),
    /** The `expiry_rule` token used. */
    rule: text('rule'),
    kbRecordId: text('kb_record_id'),
    kbLicenceTypeId: text('kb_licence_type_id'),
    kbSnapshotId: text('kb_snapshot_id').references(() => kbSnapshots.id, { onDelete: 'set null' }),
    citationUrl: text('citation_url'),
    /** The ≤25-word evidence fragment. */
    citationText: text('citation_text'),
    citationLastVerified: date('citation_last_verified'),
    confidence: text('confidence').notNull().default('high'),
    needsHumanCheck: boolean('needs_human_check').notNull().default(false),
    flagReasons: jsonb('flag_reasons').notNull().default(sql`'[]'::jsonb`),
    /** The notes that MUST render wherever this date appears (`specs/05` invariant 2). */
    notes: jsonb('notes').notNull().default(sql`'[]'::jsonb`),
    detail: jsonb('detail').notNull().default(sql`'{}'::jsonb`),
    trace: jsonb('trace').notNull().default(sql`'[]'::jsonb`),
    supersededAt: timestamp('superseded_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('deadlines_org_due_idx').on(t.orgId, t.dueOn),
    index('deadlines_licence_idx').on(t.licenceId),
    // specs/05 invariant 1, in the database: no derived deadline without a citation.
    check(
      'deadlines_citation_ck',
      sql`${t.source} <> 'derived' or ${t.citationUrl} is not null`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// M6 — alerts, per-recipient digests, suppression reasons (specs/06)
// ---------------------------------------------------------------------------

/** One digest per recipient per local send date. Never one per organisation. */
export const digests = pgTable(
  'digests',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    recipientUserId: text('recipient_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sendDate: date('send_date').notNull(),
    subject: text('subject').notNull(),
    itemCount: integer('item_count').notNull().default(0),
    providerMessageId: text('provider_message_id'),
    status: text('status').notNull().default('queued'),
    openedAt: timestamp('opened_at', { withTimezone: true }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('digests_recipient_date_idx').on(t.recipientUserId, t.sendDate)],
);

/**
 * One alert row per (deadline, offset, RECIPIENT) — wave-1b **B10**. Two
 * recipients on one organisation produce two rows, two digests and two
 * independent delivery states. The organisation-wide version meant a two-person
 * compliance team could only ever be told once, between them.
 */
export const alerts = pgTable(
  'alerts',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    deadlineId: text('deadline_id')
      .notNull()
      .references(() => deadlines.id, { onDelete: 'cascade' }),
    recipientUserId: text('recipient_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    offsetDays: integer('offset_days').notNull(),
    digestId: text('digest_id').references(() => digests.id, { onDelete: 'set null' }),
    status: text('status').notNull().default('queued'),
    /**
     * One of `added_after_offset | muted_state | recipient_paused |
     * address_suppressed | subscription_paused` — the five machine-readable
     * carve-outs the Alert Guarantee is adjudicated from (`specs/06`, B4). A
     * suppressed alert is recorded, never dropped: silence must be visible.
     */
    suppressionReason: text('suppression_reason'),
    failureReason: text('failure_reason'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('alerts_once_idx').on(t.deadlineId, t.offsetDays, t.recipientUserId),
    index('alerts_recipient_idx').on(t.recipientUserId, t.createdAt),
  ],
);

/** The scheduling row the drain claims. One per recipient. */
export const alertRecipients = pgTable(
  'alert_recipients',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: orgRef(),
    nextSendAt: timestamp('next_send_at', { withTimezone: true }).notNull(),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
    suppressedAt: timestamp('suppressed_at', { withTimezone: true }),
    suppressionReason: text('suppression_reason'),
  },
  (t) => [index('alert_recipients_due_idx').on(t.nextSendAt)],
);

export const notificationPreferences = pgTable('notification_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  orgId: orgRef(),
  offsets: jsonb('offsets').notNull().default(sql`'[90,60,30,7,0,-1]'::jsonb`),
  mutedStates: jsonb('muted_states').notNull().default(sql`'[]'::jsonb`),
  timezone: text('timezone').notNull().default('America/Chicago'),
  digestHourLocal: integer('digest_hour_local').notNull().default(7),
  weeklyBrief: boolean('weekly_brief').notNull().default(true),
  paused: boolean('paused').notNull().default(false),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// M7 — dashboard status snapshot (specs/07)
// ---------------------------------------------------------------------------

export const dashboardSummaries = pgTable('dashboard_summaries', {
  orgId: text('org_id')
    .primaryKey()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  /** `{ TX: { ready, at_risk, lapsed, not_tracked, operating, licences } , … }` */
  byState: jsonb('by_state').notNull().default(sql`'{}'::jsonb`),
  counts: jsonb('counts').notNull().default(sql`'{}'::jsonb`),
  worstStatus: text('worst_status').notNull().default('ready'),
});

// ---------------------------------------------------------------------------
// M8 — State Entry Packs (specs/08)
// ---------------------------------------------------------------------------

export const playbooks = pgTable(
  'playbooks',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    targetState: text('target_state').notNull(),
    trades: jsonb('trades').notNull().default(sql`'[]'::jsonb`),
    status: text('status').notNull().default('awaiting_payment'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    priceCents: integer('price_cents').notNull().default(0),
    creditedAgainstSubscription: boolean('credited_against_subscription').notNull().default(false),
    /** Not optional: a pack is a statement about the world on a date. */
    kbSnapshotId: text('kb_snapshot_id').references(() => kbSnapshots.id, { onDelete: 'set null' }),
    contentJson: jsonb('content_json'),
    pdfStorageKey: text('pdf_storage_key'),
    shareToken: text('share_token'),
    shareExpiresAt: timestamp('share_expires_at', { withTimezone: true }),
    /** The gap count, WRITTEN BEFORE THE CHECKOUT SESSION IS CREATED (`specs/08` AC5b). */
    needsCheckCount: integer('needs_check_count').notNull().default(0),
    /** The DISCLOSED_SET fields named on the purchase screen, before the card. */
    disclosedGaps: jsonb('disclosed_gaps').notNull().default(sql`'[]'::jsonb`),
    generatedAt: timestamp('generated_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('playbooks_org_idx').on(t.orgId, t.createdAt),
    uniqueIndex('playbooks_share_token_idx').on(t.shareToken),
  ],
);

// ---------------------------------------------------------------------------
// M9 — one-off purchases, the first-100 trial cohort, enterprise enquiries (specs/09)
// ---------------------------------------------------------------------------

export const oneOffPurchases = pgTable(
  'one_off_purchases',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    /**
     * `playbook | first_state_audit`. **`first_state_audit` is a DORMANT enum
     * value** (D1): it stays so iteration 2 is a feature flag rather than a
     * migration, and `tests/billing.test.ts` asserts no code path can write it.
     */
    kind: text('kind').notNull(),
    playbookId: text('playbook_id').references(() => playbooks.id, { onDelete: 'set null' }),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    amountCents: integer('amount_cents').notNull(),
    status: text('status').notNull().default('pending'),
    refundReason: text('refund_reason'),
    createdAt: createdAt(),
  },
  (t) => [
    index('one_off_purchases_org_idx').on(t.orgId),
    uniqueIndex('one_off_purchases_pi_idx').on(t.stripePaymentIntentId),
  ],
);

/**
 * The first-100 rule, **enforced rather than aspirational** (`specs/09` AC11).
 * `cohortNumber` is assigned once per organisation from a serialisable count, so
 * the cohort `THRESHOLDS.md` evaluates contains exactly one trial design.
 */
export const trialGrants = pgTable(
  'trial_grants',
  {
    orgId: text('org_id')
      .primaryKey()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    cohortNumber: integer('cohort_number').notNull(),
    isInternal: boolean('is_internal').notNull().default(false),
    trialDays: integer('trial_days').notNull(),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('trial_grants_cohort_idx').on(t.cohortNumber)],
);

export const enterpriseEnquiries = pgTable(
  'enterprise_enquiries',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    stateCount: integer('state_count').notNull().default(0),
    technicianCount: integer('technician_count').notNull().default(0),
    trades: jsonb('trades').notNull().default(sql`'[]'::jsonb`),
    states: jsonb('states').notNull().default(sql`'[]'::jsonb`),
    message: text('message'),
    status: text('status').notNull().default('open'),
    createdAt: createdAt(),
  },
  (t) => [index('enterprise_enquiries_org_idx').on(t.orgId)],
);

// ---------------------------------------------------------------------------
// M10 — settings, export, deletion (specs/10)
// ---------------------------------------------------------------------------

export const organisationSettings = pgTable('organisation_settings', {
  orgId: text('org_id')
    .primaryKey()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  timezone: text('timezone').notNull().default('America/Chicago'),
  digestHourLocal: integer('digest_hour_local').notNull().default(7),
  ccTechnicians: boolean('cc_technicians').notNull().default(false),
  /** `board | paper | system` — never light/dark (`IDENTITY_ARBITRATION.md` §3.2). */
  theme: text('theme').notNull().default('system'),
  dateFormat: text('date_format').notNull().default('mdy'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const dataExports = pgTable(
  'data_exports',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    requestedByUserId: text('requested_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    status: text('status').notNull().default('queued'),
    storageKey: text('storage_key'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('data_exports_org_idx').on(t.orgId, t.createdAt)],
);

export const deletionRequests = pgTable(
  'deletion_requests',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    requestedByUserId: text('requested_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    reason: text('reason'),
    /** now + 7 days; cancellable throughout (`specs/10`). */
    executeAfter: timestamp('execute_after', { withTimezone: true }).notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('deletion_requests_org_idx').on(t.orgId)],
);

// ---------------------------------------------------------------------------
// M11 — help and support (specs/11)
// ---------------------------------------------------------------------------

export const supportTickets = pgTable(
  'support_tickets',
  {
    id: text('id').primaryKey(),
    reference: text('reference').notNull(),
    orgId: text('org_id').references(() => organisations.id, { onDelete: 'set null' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    context: jsonb('context').notNull().default(sql`'{}'::jsonb`),
    /** `open | auto_answered | escalated | closed`. */
    status: text('status').notNull().default('open'),
    /** A "this rule looks wrong" ticket routes into the drift queue, not the inbox. */
    isDataQualityReport: boolean('is_data_quality_report').notNull().default(false),
    suggestedArticles: jsonb('suggested_articles').notNull().default(sql`'[]'::jsonb`),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('support_tickets_reference_idx').on(t.reference)],
);

export const helpArticleFeedback = pgTable('help_article_feedback', {
  id: text('id').primaryKey(),
  orgId: text('org_id').references(() => organisations.id, { onDelete: 'set null' }),
  slug: text('slug').notNull(),
  helpful: boolean('helpful').notNull(),
  comment: text('comment'),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// M12 — legal acceptances (specs/12)
// ---------------------------------------------------------------------------

export const legalAcceptances = pgTable(
  'legal_acceptances',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    documentSlug: text('document_slug').notNull(),
    /** Content hash, so "which version did they accept" is answerable years later. */
    documentVersion: text('document_version').notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
  },
  (t) => [index('legal_acceptances_org_idx').on(t.orgId)],
);

// ---------------------------------------------------------------------------
// M14 — knowledge-base runtime and the drift review queue (specs/14)
//
// These four are the ONLY tables without `org_id`: the knowledge base is one
// shared, versioned artefact, not a per-customer one. `tests/schema.test.ts`
// names them as the exemption rather than pattern-matching them.
// ---------------------------------------------------------------------------

export const kbSnapshots = pgTable(
  'kb_snapshots',
  {
    id: text('id').primaryKey(),
    version: text('version').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    recordCount: integer('record_count').notNull(),
    publishableCount: integer('publishable_count').notNull(),
    entryPackReadyCount: integer('entry_pack_ready_count').notNull().default(0),
    isCurrent: boolean('is_current').notNull().default(false),
    notes: text('notes'),
  },
  (t) => [uniqueIndex('kb_snapshots_version_idx').on(t.version)],
);

export const kbRecords = pgTable(
  'kb_records',
  {
    id: text('id').primaryKey(),
    snapshotId: text('snapshot_id')
      .notNull()
      .references(() => kbSnapshots.id, { onDelete: 'cascade' }),
    recordId: text('record_id').notNull(),
    state: text('state').notNull(),
    trade: text('trade').notNull(),
    publishable: boolean('publishable').notNull(),
    /** Computed at load, stored, and NOT `publishable` (`specs/14` invariant 6). */
    entryPackReady: boolean('entry_pack_ready').notNull().default(false),
    disclosedGaps: jsonb('disclosed_gaps').notNull().default(sql`'[]'::jsonb`),
    document: jsonb('document').notNull(),
    contentSha256: text('content_sha256').notNull(),
  },
  (t) => [
    uniqueIndex('kb_records_once_idx').on(t.snapshotId, t.recordId),
    index('kb_records_lookup_idx').on(t.snapshotId, t.state, t.trade),
  ],
);

export const kbSources = pgTable(
  'kb_sources',
  {
    sourceId: text('source_id').primaryKey(),
    url: text('url').notNull(),
    kind: text('kind').notNull(),
    baselineSha256: text('baseline_sha256'),
    /** Bounded excerpts, so the diff screen can be built at all (wave-1b M16). */
    baselineHead: text('baseline_head'),
    baselineTail: text('baseline_tail'),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
    lastStatus: integer('last_status'),
    /** THE APP owns this counter; `refresh_sources.py` has no notion of "three days". */
    consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  },
  (t) => [index('kb_sources_checked_idx').on(t.lastCheckedAt)],
);

export const kbDriftItems = pgTable(
  'kb_drift_items',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id')
      .notNull()
      .references(() => kbSources.sourceId, { onDelete: 'cascade' }),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    /** `content_changed | source_unreachable | normalisation_parity`. */
    kind: text('kind').notNull().default('content_changed'),
    previousSha256: text('previous_sha256'),
    currentSha256: text('current_sha256'),
    diffSummary: text('diff_summary'),
    affectedRecordIds: jsonb('affected_record_ids').notNull().default(sql`'[]'::jsonb`),
    /** Computed at detection so the queue is ordered by blast radius, not arrival. */
    affectedOrganisations: integer('affected_organisations').notNull().default(0),
    /** `open | reviewing | no_change | corrected | dismissed`. */
    status: text('status').notNull().default('open'),
    /**
     * `no_change` does NOT close an item: it stays visibly
     * "no_change — awaiting acceptance" until a deploy lands whose baseline
     * matches, because the runtime never mutates the repo (`specs/14` B11).
     */
    awaitingAcceptance: boolean('awaiting_acceptance').notNull().default(false),
    resolutionNote: text('resolution_note'),
    resolvedByUserId: text('resolved_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [
    index('kb_drift_items_status_idx').on(t.status, t.affectedOrganisations),
    uniqueIndex('kb_drift_items_open_idx').on(t.sourceId, t.currentSha256),
  ],
);

// ---------------------------------------------------------------------------
// The audit trail
// ---------------------------------------------------------------------------

/**
 * Append-only. Every write that changes a compliance fact, who did it and what
 * it was before — because "we can show you what we knew, when" is the product,
 * and because a customer's own audit file is a thing they are entitled to
 * (`specs/10` export).
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    orgId: orgRef(),
    actorUserId: text('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityTable: text('entity_table').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_log_org_at_idx').on(t.orgId, t.at)],
);

export const appSchema = {
  companyProfiles,
  entities,
  operatingStates,
  technicians,
  imports,
  licences,
  licenceDocuments,
  ceRecords,
  deadlines,
  digests,
  alerts,
  alertRecipients,
  notificationPreferences,
  dashboardSummaries,
  playbooks,
  oneOffPurchases,
  trialGrants,
  enterpriseEnquiries,
  organisationSettings,
  dataExports,
  deletionRequests,
  supportTickets,
  helpArticleFeedback,
  legalAcceptances,
  kbSnapshots,
  kbRecords,
  kbSources,
  kbDriftItems,
  auditLog,
};

export type Entity = typeof entities.$inferSelect;
export type Technician = typeof technicians.$inferSelect;
export type Licence = typeof licences.$inferSelect;
export type Deadline = typeof deadlines.$inferSelect;
export type KbSnapshot = typeof kbSnapshots.$inferSelect;
export type KbDriftItem = typeof kbDriftItems.$inferSelect;
