CREATE TABLE "alert_recipients" (
	"user_id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"next_send_at" timestamp with time zone NOT NULL,
	"last_sent_at" timestamp with time zone,
	"suppressed_at" timestamp with time zone,
	"suppression_reason" text
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"deadline_id" text NOT NULL,
	"recipient_user_id" text NOT NULL,
	"offset_days" integer NOT NULL,
	"digest_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"suppression_reason" text,
	"failure_reason" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_table" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ce_records" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"licence_id" text NOT NULL,
	"hours" numeric(5, 2) NOT NULL,
	"subject" text,
	"delivery_mode" text DEFAULT 'unknown' NOT NULL,
	"provider" text,
	"completed_on" date NOT NULL,
	"document_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"org_id" text PRIMARY KEY NOT NULL,
	"legal_name" text NOT NULL,
	"technician_count_band" text,
	"timezone" text DEFAULT 'America/Chicago' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_summaries" (
	"org_id" text PRIMARY KEY NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"by_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"worst_status" text DEFAULT 'ready' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_exports" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"requested_by_user_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"storage_key" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deadlines" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"licence_id" text,
	"kind" text NOT NULL,
	"due_on" date NOT NULL,
	"source" text NOT NULL,
	"rule" text,
	"kb_record_id" text,
	"kb_licence_type_id" text,
	"kb_snapshot_id" text,
	"citation_url" text,
	"citation_text" text,
	"citation_last_verified" date,
	"confidence" text DEFAULT 'high' NOT NULL,
	"needs_human_check" boolean DEFAULT false NOT NULL,
	"flag_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trace" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deadlines_citation_ck" CHECK ("deadlines"."source" <> 'derived' or "deadlines"."citation_url" is not null)
);
--> statement-breakpoint
CREATE TABLE "deletion_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"requested_by_user_id" text,
	"reason" text,
	"execute_after" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digests" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"recipient_user_id" text NOT NULL,
	"send_date" date NOT NULL,
	"subject" text NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"provider_message_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_enquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text,
	"state_count" integer DEFAULT 0 NOT NULL,
	"technician_count" integer DEFAULT 0 NOT NULL,
	"trades" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"states" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"message" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"entity_type" text,
	"home_state" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_article_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text,
	"slug" text NOT NULL,
	"helpful" boolean NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imports" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text,
	"filename" text NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"date_format" text DEFAULT 'mdy' NOT NULL,
	"created" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"errors_csv" text,
	"status" text DEFAULT 'mapping' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_drift_items" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text DEFAULT 'content_changed' NOT NULL,
	"previous_sha256" text,
	"current_sha256" text,
	"diff_summary" text,
	"affected_record_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"affected_organisations" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"awaiting_acceptance" boolean DEFAULT false NOT NULL,
	"resolution_note" text,
	"resolved_by_user_id" text,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "kb_records" (
	"id" text PRIMARY KEY NOT NULL,
	"snapshot_id" text NOT NULL,
	"record_id" text NOT NULL,
	"state" text NOT NULL,
	"trade" text NOT NULL,
	"publishable" boolean NOT NULL,
	"entry_pack_ready" boolean DEFAULT false NOT NULL,
	"disclosed_gaps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"document" jsonb NOT NULL,
	"content_sha256" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"record_count" integer NOT NULL,
	"publishable_count" integer NOT NULL,
	"entry_pack_ready_count" integer DEFAULT 0 NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "kb_sources" (
	"source_id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"kind" text NOT NULL,
	"baseline_sha256" text,
	"baseline_head" text,
	"baseline_tail" text,
	"last_checked_at" timestamp with time zone,
	"last_status" integer,
	"consecutive_failures" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_acceptances" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text,
	"document_slug" text NOT NULL,
	"document_version" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "licence_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"licence_id" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"sha256" text NOT NULL,
	"uploaded_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licences" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"holder_kind" text NOT NULL,
	"entity_id" text,
	"technician_id" text,
	"state" text NOT NULL,
	"trade" text NOT NULL,
	"kb_licence_type_id" text,
	"custom_type_name" text,
	"licence_number" text,
	"issued_on" date,
	"expires_on" date,
	"expiry_source" text DEFAULT 'entered' NOT NULL,
	"ce_hours_recorded" numeric(6, 2) DEFAULT '0' NOT NULL,
	"ce_carried_in_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"qualifier_disassociated_on" date,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "licences_holder_ck" CHECK (("licences"."holder_kind" = 'entity' and "licences"."entity_id" is not null and "licences"."technician_id" is null)
          or ("licences"."holder_kind" = 'technician' and "licences"."technician_id" is not null and "licences"."entity_id" is null))
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"offsets" jsonb DEFAULT '[90,60,30,7,0,-1]'::jsonb NOT NULL,
	"muted_states" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timezone" text DEFAULT 'America/Chicago' NOT NULL,
	"digest_hour_local" integer DEFAULT 7 NOT NULL,
	"weekly_brief" boolean DEFAULT true NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "one_off_purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"kind" text NOT NULL,
	"playbook_id" text,
	"stripe_payment_intent_id" text,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"refund_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operating_states" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"entity_id" text,
	"state" text NOT NULL,
	"trade" text NOT NULL,
	"status" text DEFAULT 'operating' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisation_settings" (
	"org_id" text PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'America/Chicago' NOT NULL,
	"digest_hour_local" integer DEFAULT 7 NOT NULL,
	"cc_technicians" boolean DEFAULT false NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"date_format" text DEFAULT 'mdy' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playbooks" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"target_state" text NOT NULL,
	"trades" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'awaiting_payment' NOT NULL,
	"stripe_payment_intent_id" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"credited_against_subscription" boolean DEFAULT false NOT NULL,
	"kb_snapshot_id" text,
	"content_json" jsonb,
	"pdf_storage_key" text,
	"share_token" text,
	"share_expires_at" timestamp with time zone,
	"needs_check_count" integer DEFAULT 0 NOT NULL,
	"disclosed_gaps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"org_id" text,
	"user_id" text,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"is_data_quality_report" boolean DEFAULT false NOT NULL,
	"suggested_articles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technicians" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"entity_id" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"employee_ref" text,
	"email" text,
	"primary_state" text,
	"primary_trade" text,
	"status" text DEFAULT 'active' NOT NULL,
	"external_row_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trial_grants" (
	"org_id" text PRIMARY KEY NOT NULL,
	"cohort_number" integer NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"trial_days" integer NOT NULL,
	"trial_ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_recipients" ADD CONSTRAINT "alert_recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_recipients" ADD CONSTRAINT "alert_recipients_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_deadline_id_deadlines_id_fk" FOREIGN KEY ("deadline_id") REFERENCES "public"."deadlines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_digest_id_digests_id_fk" FOREIGN KEY ("digest_id") REFERENCES "public"."digests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ce_records" ADD CONSTRAINT "ce_records_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ce_records" ADD CONSTRAINT "ce_records_licence_id_licences_id_fk" FOREIGN KEY ("licence_id") REFERENCES "public"."licences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ce_records" ADD CONSTRAINT "ce_records_document_id_licence_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."licence_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_summaries" ADD CONSTRAINT "dashboard_summaries_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_licence_id_licences_id_fk" FOREIGN KEY ("licence_id") REFERENCES "public"."licences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_kb_snapshot_id_kb_snapshots_id_fk" FOREIGN KEY ("kb_snapshot_id") REFERENCES "public"."kb_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digests" ADD CONSTRAINT "digests_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digests" ADD CONSTRAINT "digests_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_enquiries" ADD CONSTRAINT "enterprise_enquiries_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_enquiries" ADD CONSTRAINT "enterprise_enquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_article_feedback" ADD CONSTRAINT "help_article_feedback_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_drift_items" ADD CONSTRAINT "kb_drift_items_source_id_kb_sources_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."kb_sources"("source_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_drift_items" ADD CONSTRAINT "kb_drift_items_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_records" ADD CONSTRAINT "kb_records_snapshot_id_kb_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."kb_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licence_documents" ADD CONSTRAINT "licence_documents_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licence_documents" ADD CONSTRAINT "licence_documents_licence_id_licences_id_fk" FOREIGN KEY ("licence_id") REFERENCES "public"."licences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licence_documents" ADD CONSTRAINT "licence_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licences" ADD CONSTRAINT "licences_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licences" ADD CONSTRAINT "licences_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licences" ADD CONSTRAINT "licences_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_off_purchases" ADD CONSTRAINT "one_off_purchases_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_off_purchases" ADD CONSTRAINT "one_off_purchases_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_states" ADD CONSTRAINT "operating_states_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_states" ADD CONSTRAINT "operating_states_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_settings" ADD CONSTRAINT "organisation_settings_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_kb_snapshot_id_kb_snapshots_id_fk" FOREIGN KEY ("kb_snapshot_id") REFERENCES "public"."kb_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_grants" ADD CONSTRAINT "trial_grants_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_recipients_due_idx" ON "alert_recipients" USING btree ("next_send_at");--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_once_idx" ON "alerts" USING btree ("deadline_id","offset_days","recipient_user_id");--> statement-breakpoint
CREATE INDEX "alerts_recipient_idx" ON "alerts" USING btree ("recipient_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_org_at_idx" ON "audit_log" USING btree ("org_id","at");--> statement-breakpoint
CREATE INDEX "ce_records_licence_idx" ON "ce_records" USING btree ("licence_id");--> statement-breakpoint
CREATE INDEX "data_exports_org_idx" ON "data_exports" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "deadlines_org_due_idx" ON "deadlines" USING btree ("org_id","due_on");--> statement-breakpoint
CREATE INDEX "deadlines_licence_idx" ON "deadlines" USING btree ("licence_id");--> statement-breakpoint
CREATE INDEX "deletion_requests_org_idx" ON "deletion_requests" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "digests_recipient_date_idx" ON "digests" USING btree ("recipient_user_id","send_date");--> statement-breakpoint
CREATE INDEX "enterprise_enquiries_org_idx" ON "enterprise_enquiries" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "entities_org_idx" ON "entities" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "imports_org_idx" ON "imports" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "kb_drift_items_status_idx" ON "kb_drift_items" USING btree ("status","affected_organisations");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_drift_items_open_idx" ON "kb_drift_items" USING btree ("source_id","current_sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_records_once_idx" ON "kb_records" USING btree ("snapshot_id","record_id");--> statement-breakpoint
CREATE INDEX "kb_records_lookup_idx" ON "kb_records" USING btree ("snapshot_id","state","trade");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_snapshots_version_idx" ON "kb_snapshots" USING btree ("version");--> statement-breakpoint
CREATE INDEX "kb_sources_checked_idx" ON "kb_sources" USING btree ("last_checked_at");--> statement-breakpoint
CREATE INDEX "legal_acceptances_org_idx" ON "legal_acceptances" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "licence_documents_licence_idx" ON "licence_documents" USING btree ("licence_id");--> statement-breakpoint
CREATE INDEX "licences_org_expiry_idx" ON "licences" USING btree ("org_id","expires_on");--> statement-breakpoint
CREATE INDEX "licences_org_state_idx" ON "licences" USING btree ("org_id","state");--> statement-breakpoint
CREATE INDEX "one_off_purchases_org_idx" ON "one_off_purchases" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_off_purchases_pi_idx" ON "one_off_purchases" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "operating_states_org_idx" ON "operating_states" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "operating_states_unique_idx" ON "operating_states" USING btree ("org_id","entity_id","state","trade");--> statement-breakpoint
CREATE INDEX "playbooks_org_idx" ON "playbooks" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "playbooks_share_token_idx" ON "playbooks" USING btree ("share_token");--> statement-breakpoint
CREATE UNIQUE INDEX "support_tickets_reference_idx" ON "support_tickets" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "technicians_org_status_idx" ON "technicians" USING btree ("org_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "technicians_employee_ref_idx" ON "technicians" USING btree ("org_id","employee_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "trial_grants_cohort_idx" ON "trial_grants" USING btree ("cohort_number");