CREATE TABLE "kb_classifications" (
	"id" text PRIMARY KEY NOT NULL,
	"wd_id" text NOT NULL,
	"rate_group_id" text NOT NULL,
	"line_no" integer NOT NULL,
	"classification_label" text NOT NULL,
	"search_label" text NOT NULL,
	"trade_family" text,
	"base_rate" numeric(8, 2) NOT NULL,
	"fringe_rate" numeric(8, 2) NOT NULL,
	"qualifier" text,
	"footnote_text" text,
	"wd_number" text NOT NULL,
	"modification_number" integer NOT NULL,
	"publication_date" date NOT NULL,
	"source_url" text NOT NULL,
	"last_verified" timestamp with time zone NOT NULL,
	CONSTRAINT "kb_classifications_base_rate_positive" CHECK ("kb_classifications"."base_rate" > 0),
	CONSTRAINT "kb_classifications_fringe_non_negative" CHECK ("kb_classifications"."fringe_rate" >= 0)
);
--> statement-breakpoint
CREATE TABLE "kb_counties" (
	"state_code" char(2) NOT NULL,
	"sam_county_code" integer NOT NULL,
	"county_name" text NOT NULL,
	"fips_county_code" char(5),
	"slug" text NOT NULL,
	"source_url" text NOT NULL,
	"last_verified" timestamp with time zone NOT NULL,
	CONSTRAINT "kb_counties_state_code_sam_county_code_county_name_pk" PRIMARY KEY("state_code","sam_county_code","county_name")
);
--> statement-breakpoint
CREATE TABLE "kb_ingest_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"kind" text NOT NULL,
	"index_records_seen" integer,
	"determinations_new" integer,
	"determinations_changed" integer,
	"classifications_written" integer,
	"parse_coverage" numeric(6, 4),
	"status" text NOT NULL,
	"failure_reason" text,
	"detail" text
);
--> statement-breakpoint
CREATE TABLE "kb_rate_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"wd_id" text NOT NULL,
	"identifier" text NOT NULL,
	"kind" text NOT NULL,
	"effective_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_wage_determinations" (
	"id" text PRIMARY KEY NOT NULL,
	"wd_number" text NOT NULL,
	"modification_number" integer NOT NULL,
	"state_code" char(2) NOT NULL,
	"construction_types" text[] NOT NULL,
	"publication_date" date NOT NULL,
	"is_active" boolean NOT NULL,
	"is_standard" boolean DEFAULT false NOT NULL,
	"document_text" text NOT NULL,
	"document_sha256" char(64) NOT NULL,
	"parser_version" text NOT NULL,
	"source_url" text NOT NULL,
	"public_url" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"last_verified" timestamp with time zone NOT NULL,
	"superseded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_wd_counties" (
	"wd_id" text NOT NULL,
	"state_code" char(2) NOT NULL,
	"sam_county_code" integer NOT NULL,
	"county_name" text NOT NULL,
	CONSTRAINT "kb_wd_counties_wd_id_sam_county_code_county_name_pk" PRIMARY KEY("wd_id","sam_county_code","county_name")
);
--> statement-breakpoint
CREATE TABLE "kb_wd_modifications" (
	"wd_number" text NOT NULL,
	"modification_number" integer NOT NULL,
	"publication_date" date NOT NULL,
	"active" boolean NOT NULL,
	"text_held" boolean DEFAULT false NOT NULL,
	"history_source_url" text NOT NULL,
	"history_fetched_at" timestamp with time zone NOT NULL,
	CONSTRAINT "kb_wd_modifications_wd_number_modification_number_pk" PRIMARY KEY("wd_number","modification_number")
);
--> statement-breakpoint
CREATE TABLE "disclaimer_acknowledgements" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"disclaimer_version" text NOT NULL,
	"acknowledged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"token_hash" char(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by_user_id" text,
	"accessed_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_share_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"payroll_id" text NOT NULL,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256" char(64) NOT NULL,
	"page_count" integer DEFAULT 1 NOT NULL,
	"wd_number" text NOT NULL,
	"wd_modification_number" integer NOT NULL,
	"wd_publication_date" date NOT NULL,
	"form_revision" text DEFAULT 'WH-347 Rev. January 2025' NOT NULL,
	"omb_control_number" text DEFAULT '1235-0008' NOT NULL,
	"generator_version" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"payroll_id" text NOT NULL,
	"worker_id" text NOT NULL,
	"worker_entry_no" integer NOT NULL,
	"last_name" text NOT NULL,
	"first_name" text NOT NULL,
	"middle_initial" char(1),
	"identifying_no_last4" char(4) NOT NULL,
	"worker_status" text DEFAULT 'J' NOT NULL,
	"classification_label" text NOT NULL,
	"kb_classification_id" text,
	"hours_st" numeric(5, 2)[] NOT NULL,
	"hours_ot" numeric(5, 2)[] NOT NULL,
	"total_hours_st" numeric(6, 2) DEFAULT '0' NOT NULL,
	"total_hours_ot" numeric(6, 2) DEFAULT '0' NOT NULL,
	"rate_st" numeric(8, 2) NOT NULL,
	"rate_ot" numeric(8, 2) DEFAULT '0' NOT NULL,
	"fringe_credit_hourly" numeric(8, 2) DEFAULT '0' NOT NULL,
	"payment_in_lieu_hourly" numeric(8, 2) DEFAULT '0' NOT NULL,
	"gross_project" numeric(10, 2) DEFAULT '0' NOT NULL,
	"gross_all_work" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ded_tax_withholdings" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ded_fica" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ded_other" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ded_other_note" text,
	"ded_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"net_pay" numeric(10, 2) DEFAULT '0' NOT NULL,
	"wd_base_rate" numeric(8, 2),
	"wd_fringe_rate" numeric(8, 2),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payrolls" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"filer_organisation_id" text NOT NULL,
	"payroll_number" integer,
	"week_ending_date" date NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"no_work_performed" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"wd_number" text NOT NULL,
	"wd_modification_number" integer NOT NULL,
	"certifying_official_name" text,
	"certifying_official_title" text,
	"certifying_official_phone" text,
	"certifying_official_email" text,
	"additional_remarks" text,
	"certified_at" timestamp with time zone,
	"certified_by_user_id" text,
	"superseded_by_payroll_id" text,
	"submission_status" text DEFAULT 'not_sent' NOT NULL,
	"submitted_at" timestamp with time zone,
	"submission_recipient" text,
	"submission_status_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_wd_pin_history" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"wd_number" text NOT NULL,
	"wd_modification_number" integer NOT NULL,
	"pinned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unpinned_at" timestamp with time zone,
	"changed_by_user_id" text,
	"reason" text DEFAULT 'initial' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"project_or_contract_no" text DEFAULT '' NOT NULL,
	"location_description" text DEFAULT '' NOT NULL,
	"our_role" text DEFAULT 'sub' NOT NULL,
	"prime_contractor_name" text,
	"awarding_agency" text,
	"wd_id" text NOT NULL,
	"wd_number" text NOT NULL,
	"wd_modification_number" integer NOT NULL,
	"wd_pinned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wd_pinned_by_user_id" text,
	"wd_pin_method" text DEFAULT 'entered_number' NOT NULL,
	"wd_pinned_superseded" boolean DEFAULT false NOT NULL,
	"state_code" char(2) NOT NULL,
	"sam_county_code" integer,
	"county_name" text,
	"construction_type" text,
	"status" text DEFAULT 'active' NOT NULL,
	"contract_award_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wd_change_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"wd_number" text NOT NULL,
	"from_modification" integer NOT NULL,
	"to_modification" integer NOT NULL,
	"diff" jsonb NOT NULL,
	"affected_worker_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"email_sent_at" timestamp with time zone,
	"email_opened_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wd_watches" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"wd_number" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"consent_text_version" text NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_ip_hash" char(64) NOT NULL,
	"created_user_agent_hash" char(64),
	"confirm_token_hash" char(64) NOT NULL,
	"confirm_expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_ip_hash" char(64),
	"unsubscribe_token_hash" char(64) NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"unsubscribe_scope" text,
	"last_alert_sent_at" timestamp with time zone,
	"alerts_sent_count" integer DEFAULT 0 NOT NULL,
	"bounced_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wd_watches_confirm_token_hash_unique" UNIQUE("confirm_token_hash"),
	CONSTRAINT "wd_watches_unsubscribe_token_hash_unique" UNIQUE("unsubscribe_token_hash")
);
--> statement-breakpoint
CREATE TABLE "worker_classifications" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"worker_id" text NOT NULL,
	"source" text DEFAULT 'wage_determination' NOT NULL,
	"kb_classification_id" text,
	"classification_label" text NOT NULL,
	"base_rate" numeric(8, 2) NOT NULL,
	"fringe_rate" numeric(8, 2) NOT NULL,
	"wd_number" text NOT NULL,
	"wd_modification_number" integer NOT NULL,
	"mapped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"mapped_by_user_id" text,
	"unmapped_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_initial" char(1),
	"identifying_no_last4" char(4) NOT NULL,
	"default_status" text DEFAULT 'J' NOT NULL,
	"apprenticeship_program_id" text,
	"registered_classification" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kb_classifications" ADD CONSTRAINT "kb_classifications_wd_id_kb_wage_determinations_id_fk" FOREIGN KEY ("wd_id") REFERENCES "public"."kb_wage_determinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_classifications" ADD CONSTRAINT "kb_classifications_rate_group_id_kb_rate_groups_id_fk" FOREIGN KEY ("rate_group_id") REFERENCES "public"."kb_rate_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_rate_groups" ADD CONSTRAINT "kb_rate_groups_wd_id_kb_wage_determinations_id_fk" FOREIGN KEY ("wd_id") REFERENCES "public"."kb_wage_determinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_wage_determinations" ADD CONSTRAINT "kb_wage_determinations_superseded_by_kb_wage_determinations_id_fk" FOREIGN KEY ("superseded_by") REFERENCES "public"."kb_wage_determinations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_wd_counties" ADD CONSTRAINT "kb_wd_counties_wd_id_kb_wage_determinations_id_fk" FOREIGN KEY ("wd_id") REFERENCES "public"."kb_wage_determinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disclaimer_acknowledgements" ADD CONSTRAINT "disclaimer_acknowledgements_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disclaimer_acknowledgements" ADD CONSTRAINT "disclaimer_acknowledgements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_share_links" ADD CONSTRAINT "document_share_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_share_links" ADD CONSTRAINT "document_share_links_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_share_links" ADD CONSTRAINT "document_share_links_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_payroll_id_payrolls_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_payroll_id_payrolls_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_kb_classification_id_kb_classifications_id_fk" FOREIGN KEY ("kb_classification_id") REFERENCES "public"."kb_classifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_filer_organisation_id_organisations_id_fk" FOREIGN KEY ("filer_organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_certified_by_user_id_users_id_fk" FOREIGN KEY ("certified_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_superseded_by_payroll_id_payrolls_id_fk" FOREIGN KEY ("superseded_by_payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_wd_pin_history" ADD CONSTRAINT "project_wd_pin_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_wd_pin_history" ADD CONSTRAINT "project_wd_pin_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_wd_id_kb_wage_determinations_id_fk" FOREIGN KEY ("wd_id") REFERENCES "public"."kb_wage_determinations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_wd_pinned_by_user_id_users_id_fk" FOREIGN KEY ("wd_pinned_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wd_change_alerts" ADD CONSTRAINT "wd_change_alerts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wd_change_alerts" ADD CONSTRAINT "wd_change_alerts_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_classifications" ADD CONSTRAINT "worker_classifications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_classifications" ADD CONSTRAINT "worker_classifications_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_classifications" ADD CONSTRAINT "worker_classifications_kb_classification_id_kb_classifications_id_fk" FOREIGN KEY ("kb_classification_id") REFERENCES "public"."kb_classifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_classifications" ADD CONSTRAINT "worker_classifications_mapped_by_user_id_users_id_fk" FOREIGN KEY ("mapped_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kb_classifications_line_idx" ON "kb_classifications" USING btree ("wd_id","line_no");--> statement-breakpoint
CREATE INDEX "kb_classifications_search_idx" ON "kb_classifications" USING btree ("wd_id","search_label");--> statement-breakpoint
CREATE INDEX "kb_counties_state_slug_idx" ON "kb_counties" USING btree ("state_code","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_rate_groups_identity_idx" ON "kb_rate_groups" USING btree ("wd_id","identifier","effective_date");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_wd_number_mod_idx" ON "kb_wage_determinations" USING btree ("wd_number","modification_number");--> statement-breakpoint
CREATE INDEX "kb_wd_active_idx" ON "kb_wage_determinations" USING btree ("state_code","is_active");--> statement-breakpoint
CREATE INDEX "kb_wd_last_verified_idx" ON "kb_wage_determinations" USING btree ("last_verified");--> statement-breakpoint
CREATE INDEX "kb_wd_counties_lookup_idx" ON "kb_wd_counties" USING btree ("state_code","sam_county_code");--> statement-breakpoint
CREATE INDEX "kb_wd_modifications_number_idx" ON "kb_wd_modifications" USING btree ("wd_number");--> statement-breakpoint
CREATE UNIQUE INDEX "disclaimer_ack_identity_idx" ON "disclaimer_acknowledgements" USING btree ("user_id","disclaimer_version");--> statement-breakpoint
CREATE INDEX "document_share_links_document_idx" ON "document_share_links" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_identity_idx" ON "documents" USING btree ("payroll_id","kind","generator_version");--> statement-breakpoint
CREATE INDEX "documents_payroll_idx" ON "documents" USING btree ("payroll_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_lines_entry_idx" ON "payroll_lines" USING btree ("payroll_id","worker_entry_no");--> statement-breakpoint
CREATE INDEX "payroll_lines_order_idx" ON "payroll_lines" USING btree ("payroll_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "payrolls_number_idx" ON "payrolls" USING btree ("project_id","filer_organisation_id","payroll_number");--> statement-breakpoint
CREATE INDEX "payrolls_project_week_idx" ON "payrolls" USING btree ("project_id","week_ending_date");--> statement-breakpoint
CREATE INDEX "project_pin_history_project_idx" ON "project_wd_pin_history" USING btree ("project_id","pinned_at");--> statement-breakpoint
CREATE INDEX "projects_org_status_idx" ON "projects" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "projects_wd_idx" ON "projects" USING btree ("wd_number","wd_modification_number");--> statement-breakpoint
CREATE UNIQUE INDEX "wd_change_alerts_identity_idx" ON "wd_change_alerts" USING btree ("project_id","wd_number","to_modification");--> statement-breakpoint
CREATE INDEX "wd_change_alerts_project_idx" ON "wd_change_alerts" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "wd_watches_identity_idx" ON "wd_watches" USING btree ("email","wd_number");--> statement-breakpoint
CREATE INDEX "wd_watches_wd_idx" ON "wd_watches" USING btree ("wd_number","status");--> statement-breakpoint
CREATE INDEX "wd_watches_expiry_idx" ON "wd_watches" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "worker_classifications_project_idx" ON "worker_classifications" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "worker_classifications_worker_idx" ON "worker_classifications" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "workers_org_idx" ON "workers" USING btree ("org_id");