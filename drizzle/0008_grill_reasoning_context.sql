ALTER TABLE "businesses" ADD COLUMN "grill_reasoning_context" jsonb;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "grill_reasoning_last_error" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "grill_reasoning_updated_at" timestamp with time zone;