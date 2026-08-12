/**
 * Clausewright data model — the complete Drizzle schema.
 *
 * Spec: ARCHITECTURE.md §5.1 (operational schema), §5.2 (the outcome corpus, L4),
 * ADR-005 (Postgres is also the queue and the scheduler), ADR-007 (webhook
 * idempotency), ADR-008 (consent, redaction-before-promotion, version
 * attribution, deletion as a modelled state).
 *
 * Four properties of this schema are load-bearing and are NOT visible from any
 * single table declaration:
 *
 *  1. ATTRIBUTION ON EVERY RECORD. `corpus_release` + `prompt_bundle_hash` +
 *     `model_id` are stamped on `cases` at creation and carried into
 *     `l4_records`. Without them the outcome loop is a pile of anecdotes and the
 *     Process Power claim stays a hypothesis forever (ARCHITECTURE §5.2 ¶1).
 *
 *  2. PROMOTION, NOT INSERTION. Nothing enters `l4_records` directly. Raw notices
 *     live in `notice_documents` under encryption with a retention clock;
 *     promotion requires (consent ∧ redaction ∧ — for the first ~100 — human
 *     spot-check). Redaction is a gate, not a cleanup job (ADR-008 ¶2).
 *
 *  3. DELETION IS A MODELLED STATE, not a support ticket:
 *     `deletion_requested_at` / `deleted_at`, cascading from `consents.revoked_at`.
 *
 *  4. THE JOB TABLE IS THE BROKER. `jobs` is claimed with
 *     `SELECT … FOR UPDATE SKIP LOCKED` (see ./queue.ts). Enqueue is
 *     transactional with the business write — a case cannot be marked paid
 *     without its follow-up sequence being scheduled in the same transaction
 *     (ADR-005).
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { CLASSIFIER_LABELS } from '../domain/reason-codes';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const marketplaceEnum = pgEnum('marketplace', ['amazon', 'walmart', 'unknown']);

/**
 * The 33-code taxonomy plus `UNCLASSIFIED`, enforced at the database level so a
 * code that is not in the corpus cannot be persisted (CORPUS_DESIGN §3.2).
 * Append-only: adding a code is a migration, never an in-place rename.
 */
export const reasonCodeEnum = pgEnum(
  'reason_code',
  CLASSIFIER_LABELS as unknown as [string, ...string[]],
);

export const caseStatusEnum = pgEnum('case_status', [
  'intake',
  'classifying',
  'classified',
  'drafting',
  'critiquing',
  'preview_ready',
  'paid',
  'document_ready',
  'escalated',
  'refunded',
  'failed',
]);

export const escalationReasonEnum = pgEnum('escalation_reason', [
  'unclassified',
  'low_confidence',
  'thin_margin',
  'no_evidence_span',
  'refused_category',
  'out_of_scope',
  'unsupported_marketplace',
  'zero_cited_clauses',
  'seller_choice',
]);

export const noticeSourceKindEnum = pgEnum('notice_source_kind', [
  'paste',
  'email_forward',
  'manual_review',
  'storefront_liveness',
  'sp_api',
]);

export const noticeScopeEnum = pgEnum('notice_scope', ['account', 'listing', 'unknown']);

export const draftAuthorEnum = pgEnum('draft_author', ['model', 'human']);

export const paymentTierEnum = pgEnum('payment_tier', [
  'rescue', // $149
  'rescue_human', // $399
  'shield_monthly', // $49/mo, included free for 30 days (D6)
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'refunded',
  'failed',
]);

export const jobKindEnum = pgEnum('job_kind', [
  'render_pdf',
  'send_scheduled_email',
  'redact_notice',
  'promote_l4',
  'sla_breach_refund',
  'cache_rewarm',
  'process_inbound_notice',
  'escalation_review',
  'delete_subject_data',
]);

export const jobStatusEnum = pgEnum('job_status', ['pending', 'running', 'done', 'failed', 'dead']);

export const scheduledEmailKindEnum = pgEnum('scheduled_email_kind', [
  'magic_link',
  'd3',
  'd10',
  'd21',
]);

export const outcomeDecisionEnum = pgEnum('outcome_decision', [
  'reinstated',
  'rejected',
  'no_response',
  'withdrawn',
  'unknown',
]);

export const outcomeSourceEnum = pgEnum('outcome_source', [
  'email_form',
  'call',
  'inbound_forward',
]);

export const curationStateEnum = pgEnum('curation_state', [
  'raw',
  'redacted',
  'verified',
  'promoted',
  'quarantined',
]);

// ---------------------------------------------------------------------------
// Customers and orders
// ---------------------------------------------------------------------------

/**
 * N4: no user accounts, no auth, no dashboards. A `customer` is a Stripe-side
 * identity captured at Checkout — never a login. Email is the only field, and it
 * is collected by Stripe, not by a form before the paywall.
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    stripeCustomerId: text('stripe_customer_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('customers_email_uq').on(t.email),
    uniqueIndex('customers_stripe_customer_uq').on(t.stripeCustomerId),
  ],
);

// ---------------------------------------------------------------------------
// Cases and the pipeline record
// ---------------------------------------------------------------------------

export const cases = pgTable(
  'cases',
  {
    /** `case_{ulid}` — opaque, never derived from email, merchant token or
     *  Stripe id (CORPUS_DESIGN §2.3). */
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    status: caseStatusEnum('status').notNull().default('intake'),
    marketplace: marketplaceEnum('marketplace').notNull().default('unknown'),
    customerId: uuid('customer_id').references(() => customers.id),
    sourceKind: noticeSourceKindEnum('source_kind').notNull().default('paste'),

    // Attribution, stamped at creation (ADR-008 ¶3).
    corpusRelease: integer('corpus_release').notNull(),
    promptBundleHash: text('prompt_bundle_hash').notNull(),
    /** The stage-3 (drafting) model — the call that can burn the appeal, and the
     *  one an outcome is attributed to (LLM_ENGINE ADR-101). */
    modelId: text('model_id').notNull(),
    /** Per-stage pins, since ADR-101 splits tiers across stages. */
    stageModelIds: jsonb('stage_model_ids').$type<Record<string, string>>(),

    // The loss counter is the seller's own arithmetic, shown back to them
    // (ARCHITECTURE §3.1; Hormozi — real urgency, never manufactured).
    selfReportedDailyRevenueCents: integer('self_reported_daily_revenue_cents'),
    daysDarkAtIntake: integer('days_dark_at_intake'),

    // The 10-minute SLO: measured from day one, advertised only under G6.
    paidAt: timestamp('paid_at', { withTimezone: true }),
    documentReadyAt: timestamp('document_ready_at', { withTimezone: true }),

    escalatedAt: timestamp('escalated_at', { withTimezone: true }),
    escalationReason: escalationReasonEnum('escalation_reason'),
    escalationDetail: text('escalation_detail'),

    /**
     * The /ops queue's claim and resolution (ARCHITECTURE §3.6).
     *
     * `case-state-machine.ts`'s reconciliation note routes HumanQueued and
     * HumanReviewed through `status = 'escalated'` and puts the queue/review
     * distinction in `human_edits` rows. That works once a human has EDITED a
     * draft — but a case escalated out of `classifying` has no draft to attach
     * an edit to, and the reviewer still has to be able to claim it so two
     * people do not work the same seller's case. These four columns are that
     * missing half; they carry no status of their own, so the state machine is
     * untouched and `status` remains the single source of lifecycle truth.
     */
    escalationClaimedBy: text('escalation_claimed_by'),
    escalationClaimedAt: timestamp('escalation_claimed_at', { withTimezone: true }),
    escalationResolvedAt: timestamp('escalation_resolved_at', { withTimezone: true }),
    escalationResolution: text('escalation_resolution'),

    /**
     * The seller's own report of what they did with the document, and what the
     * marketplace said back. USER_JOURNEY §4's Submitted / DecisionPending /
     * Reinstated / Rejected states — which the reconciliation note assigns to
     * `outcome_reports`, where the decision itself still lives. What could not
     * live there is the *submission* moment: `outcome_reports` is created when a
     * decision is reported, so without this column the window between "I sent
     * it" and "they answered" is unrepresentable, and that window is precisely
     * what the D3/D10/D21 follow-up sequence is timed from (B9).
     */
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
  },
  (t) => [
    index('cases_status_idx').on(t.status),
    index('cases_created_at_idx').on(t.createdAt),
    index('cases_corpus_release_idx').on(t.corpusRelease),
  ],
);

/**
 * The pasted notice. Encrypted at rest with a retention clock; it is the raw
 * material for L4 but never enters L4 directly (ADR-008 ¶2).
 */
export const noticeDocuments = pgTable(
  'notice_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    rawTextEncrypted: text('raw_text_encrypted').notNull(),
    sha256: text('sha256').notNull(),
    charLength: integer('char_length').notNull(),
    receivedVia: noticeSourceKindEnum('received_via').notNull().default('paste'),
    retentionExpiresAt: timestamp('retention_expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('notice_documents_case_idx').on(t.caseId),
    index('notice_documents_retention_idx').on(t.retentionExpiresAt),
  ],
);

export const classifications = pgTable(
  'classifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    reasonCode: reasonCodeEnum('reason_code').notNull(),
    /** Self-reported by the model; code — not the model — applies the threshold
     *  (LLM_ENGINE §6.1, I5). */
    confidence: real('confidence').notNull(),
    /** top1.confidence − top2.confidence. A confident top-1 with a close second
     *  is exactly the case a human should see. */
    margin: real('margin').notNull(),
    evidenceSpans: jsonb('evidence_spans').notNull().default(sql`'[]'::jsonb`),
    candidates: jsonb('candidates').notNull().default(sql`'[]'::jsonb`),
    unclassified: boolean('unclassified').notNull().default(false),
    /** Injection tell (LLM_ENGINE §6.2 control 5): logged, not acted on in v1. */
    noticeContainsInstructions: boolean('notice_contains_instructions').notNull().default(false),
    marketplace: marketplaceEnum('marketplace').notNull().default('unknown'),
    scope: noticeScopeEnum('scope').notNull().default('unknown'),
    modelId: text('model_id').notNull(),
    usage: jsonb('usage').$type<Record<string, number>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('classifications_case_idx').on(t.caseId)],
);

/**
 * The retrieved slice, FROZEN for the life of the case (ADR-002): a revision
 * re-runs stages 3–4 only and can never silently change which policy the
 * document argues under.
 */
export const corpusSliceRefs = pgTable(
  'corpus_slice_refs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    reasonCode: reasonCodeEnum('reason_code').notNull(),
    recordIds: text('record_ids').array().notNull(),
    corpusRelease: integer('corpus_release').notNull(),
    promptBundleHash: text('prompt_bundle_hash').notNull(),
    frozenAt: timestamp('frozen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('corpus_slice_refs_case_uq').on(t.caseId)],
);

export const drafts = pgTable(
  'drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    revisionN: integer('revision_n').notNull().default(0),
    bodyMd: text('body_md').notNull(),
    /** The three sentinel sections; a missing one is a hard parse failure
     *  (LLM_ENGINE §5.4) — a POA without preventive measures is worse than none. */
    sections: jsonb('sections').notNull(),
    createdBy: draftAuthorEnum('created_by').notNull().default('model'),
    modelId: text('model_id'),
    /** Regression metrics, surfaced in /ops (ADR-004 point 3, ADR-102). */
    citationLeaks: integer('citation_leaks').notNull().default(0),
    injectionSignals: integer('injection_signals').notNull().default(0),
    corpusRelease: integer('corpus_release').notNull(),
    promptBundleHash: text('prompt_bundle_hash').notNull(),
    usage: jsonb('usage').$type<Record<string, number>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('drafts_case_revision_uq').on(t.caseId, t.revisionN)],
);

/**
 * I2's storage form. A row here exists only because a Citations API citation
 * object existed AND its `document_index` was on the per-case corpus allowlist
 * (ADR-102). There is no code path from model prose to a row in this table.
 *
 * Block indices (not char offsets) are primary: custom-content documents return
 * `content_block_location`, which is a direct index into our own clause array,
 * making clause_id resolution a total function (LLM_ENGINE E5/§4.2 — this
 * supersedes the char_location mapping in ARCHITECTURE §3.4).
 */
export const citations = pgTable(
  'citations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    draftId: uuid('draft_id')
      .notNull()
      .references(() => drafts.id, { onDelete: 'cascade' }),
    citedText: text('cited_text').notNull(),
    clauseId: text('clause_id').notNull(),
    sourceUrl: text('source_url').notNull(),
    documentTitle: text('document_title').notNull(),
    docIndex: integer('doc_index').notNull(),
    startBlockIndex: integer('start_block_index').notNull(),
    endBlockIndex: integer('end_block_index').notNull(),
    /** Retained nullable for plain-text sources; unused for custom content. */
    startChar: integer('start_char'),
    endChar: integer('end_char'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('citations_draft_idx').on(t.draftId), index('citations_clause_idx').on(t.clauseId)],
);

export const critiques = pgTable(
  'critiques',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    draftId: uuid('draft_id')
      .notNull()
      .references(() => drafts.id, { onDelete: 'cascade' }),
    /** Weighted sum over booleans, computed by us — never model-emitted
     *  (LLM_ENGINE §5.5), so it is diff-able across corpus releases. */
    readinessScore: integer('readiness_score').notNull(),
    criteria: jsonb('criteria').notNull(),
    blockingDeficiencies: text('blocking_deficiencies').array().notNull().default(sql`'{}'`),
    evidenceKitGaps: text('evidence_kit_gaps').array().notNull().default(sql`'{}'`),
    modelId: text('model_id'),
    usage: jsonb('usage').$type<Record<string, number>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('critiques_draft_idx').on(t.draftId)],
);

/**
 * "The human's corrections are the product roadmap" (ARCHITECTURE §3.6). The
 * highest-signal training data the company generates in month one, and it costs
 * nothing to record. A first-class input to the next L3 release.
 */
export const humanEdits = pgTable(
  'human_edits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    draftId: uuid('draft_id')
      .notNull()
      .references(() => drafts.id, { onDelete: 'cascade' }),
    reviewerId: text('reviewer_id').notNull(),
    diff: text('diff').notNull(),
    rationale: text('rationale'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('human_edits_draft_idx').on(t.draftId)],
);

// ---------------------------------------------------------------------------
// Billing (ADR-007)
// ---------------------------------------------------------------------------

/** The order record. No PAN, no CVV, no PCI scope: Checkout is hosted (SAQ-A). */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id').references(() => cases.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id').references(() => customers.id),
    stripeSessionId: text('stripe_session_id').notNull(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeCustomerId: text('stripe_customer_id'),
    tier: paymentTierEnum('tier').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    status: paymentStatusEnum('status').notNull().default('pending'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    /** e.g. 'slo_breach' — the guarantee is enforced by the system, not by
     *  goodwill (ARCHITECTURE §3.5). */
    refundReason: text('refund_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('payments_stripe_session_uq').on(t.stripeSessionId),
    index('payments_case_idx').on(t.caseId),
  ],
);

/**
 * Webhook idempotency. Stripe retries; a double-unlock would double-send the
 * outcome sequence and poison L4 (ADR-007). The primary key IS the Stripe
 * event id — that unique constraint is the entire mechanism.
 */
export const stripeEvents = pgTable('stripe_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  payload: jsonb('payload'),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Queue and scheduler (ADR-005)
// ---------------------------------------------------------------------------

/**
 * The job queue. Claimed with `SELECT … FOR UPDATE SKIP LOCKED` (see ./queue.ts)
 * — correct concurrent consumption without a broker, at ~30 jobs/day. Enqueue is
 * transactional with the business write, which is a correctness property a
 * separate broker would cost real effort to reproduce.
 */
export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: jobKindEnum('kind').notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    status: jobStatusEnum('status').notNull().default('pending'),
    runAfter: timestamp('run_after', { withTimezone: true }).notNull().defaultNow(),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    /** Disposability (Twelve-Factor IX): a crashed worker's lock expires and
     *  another worker reclaims the row. */
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockedBy: text('locked_by'),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [index('jobs_claim_idx').on(t.status, t.runAfter), index('jobs_kind_idx').on(t.kind)],
);

/**
 * The day-3/10/21 sequence (B9) and the magic link. Polled by the worker on a
 * fixed tick — no external cron service.
 */
export const scheduledEmails = pgTable(
  'scheduled_emails',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    kind: scheduledEmailKindEnum('kind').notNull(),
    sendAfter: timestamp('send_after', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    providerMessageId: text('provider_message_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('scheduled_emails_case_kind_uq').on(t.caseId, t.kind),
    index('scheduled_emails_due_idx').on(t.sendAfter),
  ],
);

// ---------------------------------------------------------------------------
// Shield / monitoring (ADR-006)
// ---------------------------------------------------------------------------

/**
 * I4: no credentials, no session, no SP-API. A Shield account is an opaque
 * ingest token and nothing else — `shield+{token}@in.clausewright.com`.
 */
export const shieldAccounts = pgTable(
  'shield_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').references(() => customers.id),
    caseId: text('case_id').references(() => cases.id, { onDelete: 'set null' }),
    ingestToken: text('ingest_token').notNull(),
    marketplace: marketplaceEnum('marketplace').notNull().default('unknown'),
    /** Which NoticeSource implementation serves this account (ADR-006). */
    sourceKind: noticeSourceKindEnum('source_kind').notNull().default('email_forward'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    /** D6: 30 days included with every Rescue; the retention decision lands at
     *  the moment of relief, not at the moment of panic. */
    includedUntil: timestamp('included_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('shield_accounts_ingest_token_uq').on(t.ingestToken)],
);

/** Inbound account-health mail, matched by token and run through the SAME
 *  classifier — Shield adds one adapter and zero new engines (ADR-006). */
export const inboundNotices = pgTable(
  'inbound_notices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shieldAccountId: uuid('shield_account_id')
      .notNull()
      .references(() => shieldAccounts.id, { onDelete: 'cascade' }),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    fromAddress: text('from_address'),
    subject: text('subject'),
    rawTextEncrypted: text('raw_text_encrypted').notNull(),
    sha256: text('sha256').notNull(),
    caseId: text('case_id').references(() => cases.id, { onDelete: 'set null' }),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => [index('inbound_notices_account_idx').on(t.shieldAccountId)],
);

// ---------------------------------------------------------------------------
// The outcome corpus — L4 (ADR-008, D10: the un-cuttable component)
// ---------------------------------------------------------------------------

/**
 * Consent is first-class, versioned and revocable, captured at payment, worded
 * as an exchange, and SEPARABLE FROM THE PURCHASE — declining must not block or
 * degrade it. The exact text shown is stored, so re-wording never retroactively
 * reinterprets an earlier agreement (ADR-008 ¶1).
 */
export const consents = pgTable(
  'consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    granted: boolean('granted').notNull(),
    textVersion: text('text_version').notNull(),
    consentText: text('consent_text').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }),
    /** Revocation cascades to a `delete_subject_data` job. */
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    retentionExpiresAt: timestamp('retention_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('consents_case_uq').on(t.caseId)],
);

export const outcomeReports = pgTable(
  'outcome_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    reportedAt: timestamp('reported_at', { withTimezone: true }).notNull().defaultNow(),
    source: outcomeSourceEnum('source').notNull().default('email_form'),
    submitted: boolean('submitted'),
    decision: outcomeDecisionEnum('decision').notNull().default('unknown'),
    roundsToDecision: integer('rounds_to_decision'),
    daysToDecision: integer('days_to_decision'),
    /** A free-text field we actually read. With `human_edits.diff`, one of the
     *  two highest-signal inputs to the next corpus release (ADR-008 ¶4). */
    whatWeGotWrong: text('what_we_got_wrong'),
  },
  (t) => [index('outcome_reports_case_idx').on(t.caseId)],
);

/**
 * The compounding asset. 0 records at launch. Designed for one query pattern
 * nothing else in v1 needs: "for reason code X, which drafted features co-occur
 * with reported reinstatement, and at what n?" (ARCHITECTURE §3.3).
 *
 * No row lands here without (consent ∧ redaction ∧ — for the first ~100 —
 * human spot-check).
 */
export const l4Records = pgTable(
  'l4_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    consentId: uuid('consent_id')
      .notNull()
      .references(() => consents.id, { onDelete: 'cascade' }),
    outcomeReportId: uuid('outcome_report_id').references(() => outcomeReports.id, {
      onDelete: 'set null',
    }),
    promotedAt: timestamp('promoted_at', { withTimezone: true }).notNull().defaultNow(),
    reasonCode: reasonCodeEnum('reason_code').notNull(),
    marketplace: marketplaceEnum('marketplace').notNull(),
    redactedNotice: text('redacted_notice').notNull(),
    redactedDraft: text('redacted_draft').notNull(),
    /** Deduplicate by structure, not by text: fifty near-identical drafts for one
     *  code are evidence about ONE pattern (CORPUS_DESIGN §4). */
    poaStructureHash: text('poa_structure_hash'),

    // Attribution again — this is what makes "did release 7 beat release 6?" answerable.
    corpusRelease: integer('corpus_release').notNull(),
    promptBundleHash: text('prompt_bundle_hash').notNull(),
    modelId: text('model_id').notNull(),

    redactionMethod: text('redaction_method').notNull(),
    humanSpotChecked: boolean('human_spot_checked').notNull().default(false),
    spotCheckedBy: text('spot_checked_by'),
    curationState: curationStateEnum('curation_state').notNull().default('redacted'),

    deletionRequestedAt: timestamp('deletion_requested_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('l4_records_reason_code_idx').on(t.reasonCode),
    index('l4_records_corpus_release_idx').on(t.corpusRelease),
    index('l4_records_curation_idx').on(t.curationState),
  ],
);

/**
 * Which clauses were cited, and whether the citation survived human editing —
 * the rush-tier quality signal (CORPUS_DESIGN §4.6).
 */
export const citationUses = pgTable(
  'citation_uses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    clauseId: text('clause_id').notNull(),
    survivedHumanEdit: boolean('survived_human_edit'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('citation_uses_clause_idx').on(t.clauseId)],
);

// ---------------------------------------------------------------------------

export const schema = {
  customers,
  cases,
  noticeDocuments,
  classifications,
  corpusSliceRefs,
  drafts,
  citations,
  critiques,
  humanEdits,
  payments,
  stripeEvents,
  jobs,
  scheduledEmails,
  shieldAccounts,
  inboundNotices,
  consents,
  outcomeReports,
  l4Records,
  citationUses,
};

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type DraftRow = typeof drafts.$inferSelect;
export type CitationRow = typeof citations.$inferSelect;
export type L4Record = typeof l4Records.$inferSelect;
