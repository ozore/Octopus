CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"actor_kind" text NOT NULL,
	"actor_user_id" text,
	"actor_label" text,
	"kind" text NOT NULL,
	"subject_type" text,
	"subject_id" text,
	"summary" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_actor_kind" CHECK (actor_kind IN ('user','vendor_link','system','inbound')),
	CONSTRAINT "audit_events_summary_length" CHECK (length(summary) <= 500)
);
--> statement-breakpoint
CREATE TABLE "certificate_insurers" (
	"id" text PRIMARY KEY NOT NULL,
	"certificate_id" text NOT NULL,
	"letter" text NOT NULL,
	"name" text,
	"naic" text
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"document_id" text NOT NULL,
	"extraction_id" text NOT NULL,
	"form_edition" text,
	"certificate_date" date,
	"insured_name" text,
	"certificate_holder" text,
	"earliest_expiry" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_status" CHECK (status IN ('active','superseded'))
);
--> statement-breakpoint
CREATE TABLE "comparison_results" (
	"id" text PRIMARY KEY NOT NULL,
	"comparison_id" text NOT NULL,
	"requirement_id" text NOT NULL,
	"origin" text DEFAULT 'requirement' NOT NULL,
	"kind" text NOT NULL,
	"coverage" text,
	"label" text NOT NULL,
	"severity" text DEFAULT 'blocking' NOT NULL,
	"state" text NOT NULL,
	"found_amount" bigint,
	"found_raw" text,
	"found_form" text,
	"conditional" boolean DEFAULT false NOT NULL,
	"explanation" text NOT NULL,
	"evidence" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "comparison_results_state" CHECK (state IN ('met','gap','asserted_only','not_checked','undetermined'))
);
--> statement-breakpoint
CREATE TABLE "comparisons" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"certificate_id" text,
	"requirement_set_id" text,
	"requirement_set_version" integer NOT NULL,
	"engine_version" text NOT NULL,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"evaluation_date" date NOT NULL,
	"status" text NOT NULL,
	"met_count" integer DEFAULT 0 NOT NULL,
	"gap_count" integer DEFAULT 0 NOT NULL,
	"asserted_only_count" integer DEFAULT 0 NOT NULL,
	"not_checked_count" integer DEFAULT 0 NOT NULL,
	"undetermined_count" integer DEFAULT 0 NOT NULL,
	"earliest_required_expiry" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comparisons_status" CHECK (status IN ('meets','asserted_only','expiring','gap','expired','no_certificate'))
);
--> statement-breakpoint
CREATE TABLE "coverage_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"coverage_id" text NOT NULL,
	"label" text NOT NULL,
	"label_raw" text NOT NULL,
	"amount" bigint,
	"raw" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coverages" (
	"id" text PRIMARY KEY NOT NULL,
	"certificate_id" text NOT NULL,
	"insr_letter" text,
	"type" text NOT NULL,
	"type_label_raw" text,
	"addl_insd" text,
	"subr_wvd" text,
	"policy_number" text,
	"policy_eff" date,
	"policy_exp" date,
	"form_basis" text,
	"aggregate_applies_per" text,
	"wc_officer_excluded" text
);
--> statement-breakpoint
CREATE TABLE "csv_imports" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text,
	"filename" text NOT NULL,
	"bytes" integer NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"mapping" jsonb,
	"created_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'parsing' NOT NULL,
	"errors_csv_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"vendor_id" text,
	"kind" text DEFAULT 'coi' NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"page_count" integer,
	"sha256" text NOT NULL,
	"source" text DEFAULT 'app' NOT NULL,
	"pdf_producer" text,
	"pdf_creator" text,
	"uploaded_by" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text,
	"message_id" text,
	"type" text NOT NULL,
	"payload" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extractions" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text,
	"gap_report_document_id" text,
	"org_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"model" text NOT NULL,
	"schema_version" text DEFAULT 'coi.v1' NOT NULL,
	"prompt_hash" text NOT NULL,
	"payload" jsonb,
	"doc_confidence" numeric(4, 3),
	"gate_failures" integer DEFAULT 0 NOT NULL,
	"usage" jsonb,
	"cost_cents" numeric(8, 4),
	"duration_ms" integer,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extractions_one_owner" CHECK ((document_id IS NOT NULL AND org_id IS NOT NULL AND gap_report_document_id IS NULL)
       OR (document_id IS NULL     AND org_id IS NULL     AND gap_report_document_id IS NOT NULL)),
	CONSTRAINT "extractions_status" CHECK (status IN ('pending','running','needs_review','ready','rejected','failed'))
);
--> statement-breakpoint
CREATE TABLE "field_corrections" (
	"id" text PRIMARY KEY NOT NULL,
	"extraction_id" text NOT NULL,
	"org_id" text NOT NULL,
	"path" text NOT NULL,
	"was_value" text,
	"was_confidence" numeric(4, 3),
	"was_gate" text,
	"now_value" text,
	"corrected_by" text NOT NULL,
	"corrected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gap_report_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"original_filename" text,
	"insured_name_read" text,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"storage_deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gap_report_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"email" text,
	"audience" text,
	"template_id" text,
	"requirements_snapshot" jsonb,
	"document_count" integer DEFAULT 0 NOT NULL,
	"extracted_count" integer DEFAULT 0 NOT NULL,
	"compared_count" integer DEFAULT 0 NOT NULL,
	"needs_review_count" integer DEFAULT 0 NOT NULL,
	"rejected_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'collecting' NOT NULL,
	"report_key" text,
	"converted_org_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ready_at" timestamp with time zone,
	"purge_at" timestamp with time zone NOT NULL,
	CONSTRAINT "gap_report_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "org_settings" (
	"org_id" text PRIMARY KEY NOT NULL,
	"entity_block" text,
	"alternate_holders" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"audience" text,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipient_sends" (
	"email" text PRIMARY KEY NOT NULL,
	"last_sent_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"certificate_id" text,
	"total_for_expiry" integer DEFAULT 0 NOT NULL,
	"rung" text NOT NULL,
	"expiry_date" date NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"recipient_kind" text NOT NULL,
	"recipient_email" text NOT NULL,
	"message_id" text,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"skipped_reason" text,
	"upload_link_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminders_status" CHECK (status IN ('scheduled','sending','sent','delivered','bounced','complained','cancelled','skipped')),
	CONSTRAINT "reminders_recipient_kind" CHECK (recipient_kind IN ('vendor','producer'))
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"created_by" text,
	"scope" jsonb,
	"format" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"storage_key" text,
	"bytes" integer,
	"vendor_count" integer DEFAULT 0 NOT NULL,
	"gap_count" integer DEFAULT 0 NOT NULL,
	"asserted_only_count" integer DEFAULT 0 NOT NULL,
	"not_checked_count" integer DEFAULT 0 NOT NULL,
	"needs_review_count" integer DEFAULT 0 NOT NULL,
	"engine_version" text,
	"share_token_hash" text,
	"share_expires_at" timestamp with time zone,
	"share_revoked_at" timestamp with time zone,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"audience" text NOT NULL,
	"source_template_id" text,
	"source_template_version" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"is_org_default" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" text PRIMARY KEY NOT NULL,
	"requirement_set_id" text NOT NULL,
	"org_id" text NOT NULL,
	"kind" text NOT NULL,
	"coverage" text,
	"limit_label" text,
	"min_amount" bigint,
	"combinable" boolean DEFAULT false NOT NULL,
	"endorsement_key" text,
	"accepts_forms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"condition" jsonb,
	"other_label" text,
	"label" text,
	"severity" text DEFAULT 'blocking' NOT NULL,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "requirements_min_amount_positive" CHECK (min_amount IS NULL OR min_amount > 0),
	CONSTRAINT "requirements_severity" CHECK (severity IN ('blocking','advisory'))
);
--> statement-breakpoint
CREATE TABLE "suppressions" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text,
	"email" text NOT NULL,
	"scope" text DEFAULT 'org' NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppressions_scope" CHECK (scope IN ('org','global')),
	CONSTRAINT "suppressions_scope_org" CHECK ((scope = 'global' AND org_id IS NULL) OR (scope = 'org' AND org_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "trial_consents" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text,
	"stripe_checkout_session_id" text,
	"disclosure_text" text NOT NULL,
	"price_id" text,
	"first_charge_at" timestamp with time zone,
	"amount_cents" integer,
	"shown_at" timestamp with time zone,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "upload_links" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by" text,
	"created_for" text DEFAULT 'manual' NOT NULL,
	"revoked_at" timestamp with time zone,
	"first_opened_at" timestamp with time zone,
	"last_opened_at" timestamp with time zone,
	"use_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "upload_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "vendor_types" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"requirement_set_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"vendor_type_id" text,
	"contact_email" text,
	"contact_label" text,
	"external_ref" text,
	"status" text DEFAULT 'no_certificate' NOT NULL,
	"earliest_required_expiry" date,
	"reminders_paused" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_status" CHECK (status IN ('meets','asserted_only','expiring','gap','expired','no_certificate'))
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_insurers" ADD CONSTRAINT "certificate_insurers_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_extraction_id_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."extractions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparison_results" ADD CONSTRAINT "comparison_results_comparison_id_comparisons_id_fk" FOREIGN KEY ("comparison_id") REFERENCES "public"."comparisons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_requirement_set_id_requirement_sets_id_fk" FOREIGN KEY ("requirement_set_id") REFERENCES "public"."requirement_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_limits" ADD CONSTRAINT "coverage_limits_coverage_id_coverages_id_fk" FOREIGN KEY ("coverage_id") REFERENCES "public"."coverages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverages" ADD CONSTRAINT "coverages_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_imports" ADD CONSTRAINT "csv_imports_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_imports" ADD CONSTRAINT "csv_imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_gap_report_document_id_gap_report_documents_id_fk" FOREIGN KEY ("gap_report_document_id") REFERENCES "public"."gap_report_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_corrections" ADD CONSTRAINT "field_corrections_extraction_id_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."extractions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_corrections" ADD CONSTRAINT "field_corrections_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_corrections" ADD CONSTRAINT "field_corrections_corrected_by_users_id_fk" FOREIGN KEY ("corrected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gap_report_documents" ADD CONSTRAINT "gap_report_documents_session_id_gap_report_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gap_report_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gap_report_sessions" ADD CONSTRAINT "gap_report_sessions_converted_org_id_organisations_id_fk" FOREIGN KEY ("converted_org_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_settings" ADD CONSTRAINT "org_settings_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_upload_link_id_upload_links_id_fk" FOREIGN KEY ("upload_link_id") REFERENCES "public"."upload_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_sets" ADD CONSTRAINT "requirement_sets_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_sets" ADD CONSTRAINT "requirement_sets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_requirement_set_id_requirement_sets_id_fk" FOREIGN KEY ("requirement_set_id") REFERENCES "public"."requirement_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppressions" ADD CONSTRAINT "suppressions_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_consents" ADD CONSTRAINT "trial_consents_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_consents" ADD CONSTRAINT "trial_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_links" ADD CONSTRAINT "upload_links_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_links" ADD CONSTRAINT "upload_links_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_links" ADD CONSTRAINT "upload_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_types" ADD CONSTRAINT "vendor_types_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_types" ADD CONSTRAINT "vendor_types_requirement_set_id_requirement_sets_id_fk" FOREIGN KEY ("requirement_set_id") REFERENCES "public"."requirement_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_vendor_type_id_vendor_types_id_fk" FOREIGN KEY ("vendor_type_id") REFERENCES "public"."vendor_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_org_idx" ON "audit_events" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_subject_idx" ON "audit_events" USING btree ("org_id","subject_type","subject_id","created_at");--> statement-breakpoint
CREATE INDEX "certificate_insurers_cert_idx" ON "certificate_insurers" USING btree ("certificate_id");--> statement-breakpoint
CREATE INDEX "certificates_vendor_active" ON "certificates" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "certificates_org_idx" ON "certificates" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "comparison_results_comparison_idx" ON "comparison_results" USING btree ("comparison_id","sort_order");--> statement-breakpoint
CREATE INDEX "comparisons_vendor_idx" ON "comparisons" USING btree ("vendor_id","evaluated_at");--> statement-breakpoint
CREATE INDEX "comparisons_org_idx" ON "comparisons" USING btree ("org_id","evaluated_at");--> statement-breakpoint
CREATE INDEX "coverage_limits_coverage_idx" ON "coverage_limits" USING btree ("coverage_id");--> statement-breakpoint
CREATE INDEX "coverages_certificate_idx" ON "coverages" USING btree ("certificate_id");--> statement-breakpoint
CREATE INDEX "csv_imports_org_idx" ON "csv_imports" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_org_sha" ON "documents" USING btree ("org_id","sha256");--> statement-breakpoint
CREATE INDEX "documents_vendor_idx" ON "documents" USING btree ("vendor_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "email_events_message_idx" ON "email_events" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "extractions_document_idx" ON "extractions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "extractions_org_status_idx" ON "extractions" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "field_corrections_extraction_idx" ON "field_corrections" USING btree ("extraction_id");--> statement-breakpoint
CREATE INDEX "gap_report_documents_session_idx" ON "gap_report_documents" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "gap_report_sessions_purge_idx" ON "gap_report_sessions" USING btree ("purge_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reminders_unique_rung" ON "reminders" USING btree ("vendor_id","rung","expiry_date","recipient_email");--> statement-breakpoint
CREATE INDEX "reminders_due_idx" ON "reminders" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "reminders_org_idx" ON "reminders" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "reports_org_idx" ON "reports" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_share_token" ON "reports" USING btree ("share_token_hash");--> statement-breakpoint
CREATE INDEX "requirement_sets_org_idx" ON "requirement_sets" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "requirement_sets_one_default" ON "requirement_sets" USING btree ("org_id") WHERE "requirement_sets"."is_org_default";--> statement-breakpoint
CREATE INDEX "requirements_set_idx" ON "requirements" USING btree ("requirement_set_id","sort_order");--> statement-breakpoint
CREATE INDEX "requirements_org_idx" ON "requirements" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppressions_org_email" ON "suppressions" USING btree ("org_id","email") WHERE "suppressions"."scope" = 'org';--> statement-breakpoint
CREATE UNIQUE INDEX "suppressions_global_email" ON "suppressions" USING btree ("email") WHERE "suppressions"."scope" = 'global';--> statement-breakpoint
CREATE INDEX "trial_consents_org_idx" ON "trial_consents" USING btree ("org_id","accepted_at");--> statement-breakpoint
CREATE INDEX "upload_links_vendor_idx" ON "upload_links" USING btree ("vendor_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_types_org_key" ON "vendor_types" USING btree ("org_id","key");--> statement-breakpoint
CREATE INDEX "vendors_org_status_idx" ON "vendors" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "vendors_org_expiry_idx" ON "vendors" USING btree ("org_id","earliest_required_expiry");--> statement-breakpoint
CREATE INDEX "vendors_org_name_idx" ON "vendors" USING btree ("org_id","name");