CREATE TYPE "public"."execution_adapter" AS ENUM('hermes_agent_cli', 'claude_code_cli', 'cursor_agent_cli');--> statement-breakpoint
CREATE TYPE "public"."model_routing" AS ENUM('litellm_runpod', 'cursor_managed', 'cursor_allowlist');--> statement-breakpoint
CREATE TABLE "communication_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"from_role" text NOT NULL,
	"to_role" text NOT NULL,
	"direction" text NOT NULL,
	"allowed_intents" jsonb NOT NULL,
	"allowed_artifacts" jsonb NOT NULL,
	"requires_human_ack" boolean DEFAULT false NOT NULL,
	"quota_per_hour" integer,
	"quota_mode" text DEFAULT 'warn_only' NOT NULL,
	"template_id" text,
	"template_version" text,
	"derived_from_template_id" text,
	"derived_from_template_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gate_kinds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"default_mode" text NOT NULL,
	"template_id" text,
	"template_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "execution_adapter" "execution_adapter";--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "model_routing" "model_routing";--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "tier" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "template_id" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "template_version" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "derived_from_template_id" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "derived_from_template_version" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "communication_edges" ADD CONSTRAINT "communication_edges_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_kinds" ADD CONSTRAINT "gate_kinds_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "communication_edges_business_from_to_unique" ON "communication_edges" USING btree ("business_id","from_role","to_role");--> statement-breakpoint
CREATE INDEX "communication_edges_business_id_idx" ON "communication_edges" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gate_kinds_business_id_slug_unique" ON "gate_kinds" USING btree ("business_id","slug");--> statement-breakpoint
CREATE INDEX "gate_kinds_business_id_idx" ON "gate_kinds" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_business_id_slug_unique" ON "agents" USING btree ("business_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_business_id_slug_unique" ON "teams" USING btree ("business_id","slug");