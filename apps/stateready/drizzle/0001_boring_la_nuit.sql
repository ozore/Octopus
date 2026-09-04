CREATE TABLE "shared_links" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"kind" text NOT NULL,
	"token" text NOT NULL,
	"subject_id" text,
	"label" text,
	"created_by_user_id" text,
	"revoked_at" timestamp with time zone,
	"last_viewed_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_subject_id_technicians_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shared_links_token_idx" ON "shared_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "shared_links_org_idx" ON "shared_links" USING btree ("org_id","kind");