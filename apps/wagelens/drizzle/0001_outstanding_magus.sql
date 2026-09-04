CREATE TABLE "apprenticeship_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"program_name" text NOT NULL,
	"registrar" text DEFAULT 'OA' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conformance_worksheets" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"worker_id" text,
	"duties_description" text DEFAULT '' NOT NULL,
	"proposed_classification" text DEFAULT '' NOT NULL,
	"proposed_base_rate" numeric(8, 2) DEFAULT '0' NOT NULL,
	"proposed_fringe_rate" numeric(8, 2) DEFAULT '0' NOT NULL,
	"compared_classifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"wd_number" text NOT NULL,
	"wd_modification_number" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"searches_before" integer DEFAULT 0 NOT NULL,
	"handed_off_at" timestamp with time zone,
	"outcome_recorded_at" timestamp with time zone,
	"outcome_note" text,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_terms_acceptances" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"terms_version" char(64) NOT NULL,
	"price_lookup_key" text NOT NULL,
	"disclosed_amount_cents" integer NOT NULL,
	"disclosed_charge_date" date NOT NULL,
	"disclosed_interval" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_ip_hash" char(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_signups" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"tier" text NOT NULL,
	"surface" text NOT NULL,
	"consent_text_version" text NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_ip_hash" char(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisation_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"business_address_line1" text,
	"business_address_line2" text,
	"business_city" text,
	"business_state_code" char(2),
	"business_postal_code" text,
	"business_phone" text,
	"workweek_start_day" integer DEFAULT 0 NOT NULL,
	"default_daily_hours" numeric(4, 2) DEFAULT '8.00' NOT NULL,
	"default_certifying_name" text,
	"default_certifying_title" text,
	"default_certifying_phone" text,
	"default_certifying_email" text,
	"alert_emails_enabled" boolean DEFAULT true NOT NULL,
	"deletion_requested_at" timestamp with time zone,
	"deletion_requested_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apprenticeship_programs" ADD CONSTRAINT "apprenticeship_programs_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conformance_worksheets" ADD CONSTRAINT "conformance_worksheets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conformance_worksheets" ADD CONSTRAINT "conformance_worksheets_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conformance_worksheets" ADD CONSTRAINT "conformance_worksheets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_terms_acceptances" ADD CONSTRAINT "subscription_terms_acceptances_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_terms_acceptances" ADD CONSTRAINT "subscription_terms_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_settings" ADD CONSTRAINT "organisation_settings_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_settings" ADD CONSTRAINT "organisation_settings_deletion_requested_by_user_id_users_id_fk" FOREIGN KEY ("deletion_requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "apprenticeship_programs_identity_idx" ON "apprenticeship_programs" USING btree ("org_id","program_name");--> statement-breakpoint
CREATE INDEX "conformance_worksheets_project_idx" ON "conformance_worksheets" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "conformance_worksheets_worker_idx" ON "conformance_worksheets" USING btree ("worker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_terms_identity_idx" ON "subscription_terms_acceptances" USING btree ("org_id","terms_version","price_lookup_key");--> statement-breakpoint
CREATE INDEX "subscription_terms_org_idx" ON "subscription_terms_acceptances" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_signups_identity_idx" ON "waitlist_signups" USING btree ("email","tier");--> statement-breakpoint
CREATE UNIQUE INDEX "organisation_settings_org_idx" ON "organisation_settings" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "organisation_settings_deletion_idx" ON "organisation_settings" USING btree ("deletion_requested_at");