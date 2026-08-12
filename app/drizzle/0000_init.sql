CREATE TYPE "public"."case_status" AS ENUM('intake', 'classifying', 'classified', 'drafting', 'critiquing', 'preview_ready', 'paid', 'document_ready', 'escalated', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."curation_state" AS ENUM('raw', 'redacted', 'verified', 'promoted', 'quarantined');--> statement-breakpoint
CREATE TYPE "public"."draft_author" AS ENUM('model', 'human');--> statement-breakpoint
CREATE TYPE "public"."escalation_reason" AS ENUM('unclassified', 'low_confidence', 'thin_margin', 'no_evidence_span', 'refused_category', 'out_of_scope', 'unsupported_marketplace', 'zero_cited_clauses', 'seller_choice');--> statement-breakpoint
CREATE TYPE "public"."job_kind" AS ENUM('render_pdf', 'send_scheduled_email', 'redact_notice', 'promote_l4', 'sla_breach_refund', 'cache_rewarm', 'process_inbound_notice', 'escalation_review', 'delete_subject_data');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'done', 'failed', 'dead');--> statement-breakpoint
CREATE TYPE "public"."marketplace" AS ENUM('amazon', 'walmart', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."notice_scope" AS ENUM('account', 'listing', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."notice_source_kind" AS ENUM('paste', 'email_forward', 'manual_review', 'storefront_liveness', 'sp_api');--> statement-breakpoint
CREATE TYPE "public"."outcome_decision" AS ENUM('reinstated', 'rejected', 'no_response', 'withdrawn', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."outcome_source" AS ENUM('email_form', 'call', 'inbound_forward');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_tier" AS ENUM('rescue', 'rescue_human', 'shield_monthly');--> statement-breakpoint
CREATE TYPE "public"."reason_code" AS ENUM('AMZ.AUTH.INAUTHENTIC', 'AMZ.AUTH.COUNTERFEIT', 'AMZ.AUTH.CONDITION', 'AMZ.AUTH.EXPIRY', 'AMZ.IP.TRADEMARK', 'AMZ.IP.COPYRIGHT', 'AMZ.IP.PATENT', 'AMZ.COC.SECTION3', 'AMZ.COC.LINKED', 'AMZ.COC.MULTIACCOUNT', 'AMZ.COC.REVIEW_MANIP', 'AMZ.COC.RANK_ABUSE', 'AMZ.COC.SEARCH_ABUSE', 'AMZ.COC.DIVERSION', 'AMZ.COC.SELLER_ABUSE', 'AMZ.COC.BIZ_NAME', 'AMZ.COC.FRAUD', 'AMZ.PERF.ODR', 'AMZ.PERF.LSR', 'AMZ.PERF.PCR', 'AMZ.PERF.VTR', 'AMZ.PERF.AHR', 'AMZ.SAFETY.PRODUCT', 'AMZ.SAFETY.RESTRICTED', 'AMZ.SAFETY.GPSR', 'AMZ.OPS.DROPSHIP', 'AMZ.OPS.VERIFICATION', 'WMT.PERF.STANDARDS', 'WMT.PERF.ODR', 'WMT.COC.CONDUCT', 'WMT.TRUST.SAFETY', 'WMT.OPS.PROHIBITED', 'WMT.AGREEMENT.RETAILER', 'UNCLASSIFIED');--> statement-breakpoint
CREATE TYPE "public"."scheduled_email_kind" AS ENUM('magic_link', 'd3', 'd10', 'd21');--> statement-breakpoint
CREATE TABLE "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "case_status" DEFAULT 'intake' NOT NULL,
	"marketplace" "marketplace" DEFAULT 'unknown' NOT NULL,
	"customer_id" uuid,
	"source_kind" "notice_source_kind" DEFAULT 'paste' NOT NULL,
	"corpus_release" integer NOT NULL,
	"prompt_bundle_hash" text NOT NULL,
	"model_id" text NOT NULL,
	"stage_model_ids" jsonb,
	"self_reported_daily_revenue_cents" integer,
	"days_dark_at_intake" integer,
	"paid_at" timestamp with time zone,
	"document_ready_at" timestamp with time zone,
	"escalated_at" timestamp with time zone,
	"escalation_reason" "escalation_reason",
	"escalation_detail" text
);
--> statement-breakpoint
CREATE TABLE "citation_uses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"clause_id" text NOT NULL,
	"survived_human_edit" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"cited_text" text NOT NULL,
	"clause_id" text NOT NULL,
	"source_url" text NOT NULL,
	"document_title" text NOT NULL,
	"doc_index" integer NOT NULL,
	"start_block_index" integer NOT NULL,
	"end_block_index" integer NOT NULL,
	"start_char" integer,
	"end_char" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"reason_code" "reason_code" NOT NULL,
	"confidence" real NOT NULL,
	"margin" real NOT NULL,
	"evidence_spans" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"candidates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unclassified" boolean DEFAULT false NOT NULL,
	"notice_contains_instructions" boolean DEFAULT false NOT NULL,
	"marketplace" "marketplace" DEFAULT 'unknown' NOT NULL,
	"scope" "notice_scope" DEFAULT 'unknown' NOT NULL,
	"model_id" text NOT NULL,
	"usage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"granted" boolean NOT NULL,
	"text_version" text NOT NULL,
	"consent_text" text NOT NULL,
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"retention_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corpus_slice_refs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"reason_code" "reason_code" NOT NULL,
	"record_ids" text[] NOT NULL,
	"corpus_release" integer NOT NULL,
	"prompt_bundle_hash" text NOT NULL,
	"frozen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "critiques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"readiness_score" integer NOT NULL,
	"criteria" jsonb NOT NULL,
	"blocking_deficiencies" text[] DEFAULT '{}' NOT NULL,
	"evidence_kit_gaps" text[] DEFAULT '{}' NOT NULL,
	"model_id" text,
	"usage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"revision_n" integer DEFAULT 0 NOT NULL,
	"body_md" text NOT NULL,
	"sections" jsonb NOT NULL,
	"created_by" "draft_author" DEFAULT 'model' NOT NULL,
	"model_id" text,
	"citation_leaks" integer DEFAULT 0 NOT NULL,
	"injection_signals" integer DEFAULT 0 NOT NULL,
	"corpus_release" integer NOT NULL,
	"prompt_bundle_hash" text NOT NULL,
	"usage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "human_edits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"reviewer_id" text NOT NULL,
	"diff" text NOT NULL,
	"rationale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shield_account_id" uuid NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"from_address" text,
	"subject" text,
	"raw_text_encrypted" text NOT NULL,
	"sha256" text NOT NULL,
	"case_id" text,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "job_kind" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "l4_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consent_id" uuid NOT NULL,
	"outcome_report_id" uuid,
	"promoted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason_code" "reason_code" NOT NULL,
	"marketplace" "marketplace" NOT NULL,
	"redacted_notice" text NOT NULL,
	"redacted_draft" text NOT NULL,
	"poa_structure_hash" text,
	"corpus_release" integer NOT NULL,
	"prompt_bundle_hash" text NOT NULL,
	"model_id" text NOT NULL,
	"redaction_method" text NOT NULL,
	"human_spot_checked" boolean DEFAULT false NOT NULL,
	"spot_checked_by" text,
	"curation_state" "curation_state" DEFAULT 'redacted' NOT NULL,
	"deletion_requested_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notice_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"raw_text_encrypted" text NOT NULL,
	"sha256" text NOT NULL,
	"char_length" integer NOT NULL,
	"received_via" "notice_source_kind" DEFAULT 'paste' NOT NULL,
	"retention_expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "outcome_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" "outcome_source" DEFAULT 'email_form' NOT NULL,
	"submitted" boolean,
	"decision" "outcome_decision" DEFAULT 'unknown' NOT NULL,
	"rounds_to_decision" integer,
	"days_to_decision" integer,
	"what_we_got_wrong" text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text,
	"customer_id" uuid,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_customer_id" text,
	"tier" "payment_tier" NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"refund_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" text NOT NULL,
	"kind" "scheduled_email_kind" NOT NULL,
	"send_after" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"provider_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shield_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"case_id" text,
	"ingest_token" text NOT NULL,
	"marketplace" "marketplace" DEFAULT 'unknown' NOT NULL,
	"source_kind" "notice_source_kind" DEFAULT 'email_forward' NOT NULL,
	"stripe_subscription_id" text,
	"included_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_uses" ADD CONSTRAINT "citation_uses_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corpus_slice_refs" ADD CONSTRAINT "corpus_slice_refs_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critiques" ADD CONSTRAINT "critiques_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_edits" ADD CONSTRAINT "human_edits_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_notices" ADD CONSTRAINT "inbound_notices_shield_account_id_shield_accounts_id_fk" FOREIGN KEY ("shield_account_id") REFERENCES "public"."shield_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_notices" ADD CONSTRAINT "inbound_notices_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "l4_records" ADD CONSTRAINT "l4_records_consent_id_consents_id_fk" FOREIGN KEY ("consent_id") REFERENCES "public"."consents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "l4_records" ADD CONSTRAINT "l4_records_outcome_report_id_outcome_reports_id_fk" FOREIGN KEY ("outcome_report_id") REFERENCES "public"."outcome_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notice_documents" ADD CONSTRAINT "notice_documents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_reports" ADD CONSTRAINT "outcome_reports_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shield_accounts" ADD CONSTRAINT "shield_accounts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shield_accounts" ADD CONSTRAINT "shield_accounts_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cases_status_idx" ON "cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cases_created_at_idx" ON "cases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cases_corpus_release_idx" ON "cases" USING btree ("corpus_release");--> statement-breakpoint
CREATE INDEX "citation_uses_clause_idx" ON "citation_uses" USING btree ("clause_id");--> statement-breakpoint
CREATE INDEX "citations_draft_idx" ON "citations" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "citations_clause_idx" ON "citations" USING btree ("clause_id");--> statement-breakpoint
CREATE INDEX "classifications_case_idx" ON "classifications" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consents_case_uq" ON "consents" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "corpus_slice_refs_case_uq" ON "corpus_slice_refs" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "critiques_draft_idx" ON "critiques" USING btree ("draft_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_email_uq" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_stripe_customer_uq" ON "customers" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "drafts_case_revision_uq" ON "drafts" USING btree ("case_id","revision_n");--> statement-breakpoint
CREATE INDEX "human_edits_draft_idx" ON "human_edits" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "inbound_notices_account_idx" ON "inbound_notices" USING btree ("shield_account_id");--> statement-breakpoint
CREATE INDEX "jobs_claim_idx" ON "jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "jobs_kind_idx" ON "jobs" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "l4_records_reason_code_idx" ON "l4_records" USING btree ("reason_code");--> statement-breakpoint
CREATE INDEX "l4_records_corpus_release_idx" ON "l4_records" USING btree ("corpus_release");--> statement-breakpoint
CREATE INDEX "l4_records_curation_idx" ON "l4_records" USING btree ("curation_state");--> statement-breakpoint
CREATE INDEX "notice_documents_case_idx" ON "notice_documents" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "notice_documents_retention_idx" ON "notice_documents" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE INDEX "outcome_reports_case_idx" ON "outcome_reports" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_stripe_session_uq" ON "payments" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "payments_case_idx" ON "payments" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scheduled_emails_case_kind_uq" ON "scheduled_emails" USING btree ("case_id","kind");--> statement-breakpoint
CREATE INDEX "scheduled_emails_due_idx" ON "scheduled_emails" USING btree ("send_after");--> statement-breakpoint
CREATE UNIQUE INDEX "shield_accounts_ingest_token_uq" ON "shield_accounts" USING btree ("ingest_token");