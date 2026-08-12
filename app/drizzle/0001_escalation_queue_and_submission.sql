ALTER TABLE "cases" ADD COLUMN "escalation_claimed_by" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "escalation_claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "escalation_resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "escalation_resolution" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "submitted_at" timestamp with time zone;