CREATE TABLE "email_change_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"new_email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"source_purchase_id" text,
	"sku" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"applied_at" timestamp with time zone,
	"applied_to_subscription_id" text,
	"applied_plan_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "one_off_purchases" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "email_change_requests" ADD CONSTRAINT "email_change_requests_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_change_requests" ADD CONSTRAINT "email_change_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_credits" ADD CONSTRAINT "plan_credits_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_credits" ADD CONSTRAINT "plan_credits_source_purchase_id_one_off_purchases_id_fk" FOREIGN KEY ("source_purchase_id") REFERENCES "public"."one_off_purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_change_token_idx" ON "email_change_requests" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_change_user_idx" ON "email_change_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plan_credits_org_idx" ON "plan_credits" USING btree ("org_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_credits_one_pending_idx" ON "plan_credits" USING btree ("org_id") WHERE status = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "plan_credits_source_idx" ON "plan_credits" USING btree ("source_purchase_id");