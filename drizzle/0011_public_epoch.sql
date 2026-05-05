CREATE TYPE "public"."agent_job_status" AS ENUM('queued', 'inflight', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."runpod_instance_state" AS ENUM('cold', 'warming', 'warm', 'draining', 'idle');--> statement-breakpoint
CREATE TABLE "agent_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"agent_slug" text NOT NULL,
	"adapter" "execution_adapter" NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "agent_job_status" DEFAULT 'queued' NOT NULL,
	"correlation_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"from_role" text,
	"to_role" text,
	"output" text,
	"metadata" jsonb,
	"enqueued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "runpod_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text DEFAULT 'default' NOT NULL,
	"state" "runpod_instance_state" DEFAULT 'cold' NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"endpoint_url" text,
	"last_fair_share_business_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_jobs" ADD CONSTRAINT "agent_jobs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_jobs_business_id_status_idx" ON "agent_jobs" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "agent_jobs_status_enqueued_idx" ON "agent_jobs" USING btree ("status","enqueued_at");--> statement-breakpoint
CREATE UNIQUE INDEX "runpod_instances_slug_unique" ON "runpod_instances" USING btree ("slug");