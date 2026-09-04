CREATE TABLE "fringe_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"plan_type" text DEFAULT 'other' NOT NULL,
	"plan_no" text,
	"is_funded" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_line_fringe_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"payroll_line_id" text NOT NULL,
	"fringe_plan_id" text NOT NULL,
	"hourly_credit" numeric(8, 2) DEFAULT '0' NOT NULL,
	"plan_name" text NOT NULL,
	"plan_type" text DEFAULT 'other' NOT NULL,
	"plan_no" text,
	"is_funded" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_blobs" (
	"storage_key" text PRIMARY KEY NOT NULL,
	"content_type" text DEFAULT 'application/pdf' NOT NULL,
	"byte_size" integer NOT NULL,
	"content_base64" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_exports" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"project_id" text,
	"format" text NOT NULL,
	"from_date" date,
	"to_date" date,
	"payroll_count" integer DEFAULT 0 NOT NULL,
	"storage_key" text,
	"byte_size" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'building' NOT NULL,
	"failure_reason" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fringe_plans" ADD CONSTRAINT "fringe_plans_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_line_fringe_credits" ADD CONSTRAINT "payroll_line_fringe_credits_payroll_line_id_payroll_lines_id_fk" FOREIGN KEY ("payroll_line_id") REFERENCES "public"."payroll_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_line_fringe_credits" ADD CONSTRAINT "payroll_line_fringe_credits_fringe_plan_id_fringe_plans_id_fk" FOREIGN KEY ("fringe_plan_id") REFERENCES "public"."fringe_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_exports" ADD CONSTRAINT "payroll_exports_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_exports" ADD CONSTRAINT "payroll_exports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_exports" ADD CONSTRAINT "payroll_exports_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fringe_plans_identity_idx" ON "fringe_plans" USING btree ("org_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_line_fringe_credits_identity_idx" ON "payroll_line_fringe_credits" USING btree ("payroll_line_id","fringe_plan_id");--> statement-breakpoint
CREATE INDEX "payroll_line_fringe_credits_line_idx" ON "payroll_line_fringe_credits" USING btree ("payroll_line_id");--> statement-breakpoint
CREATE INDEX "payroll_exports_org_idx" ON "payroll_exports" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "payroll_exports_project_idx" ON "payroll_exports" USING btree ("project_id");