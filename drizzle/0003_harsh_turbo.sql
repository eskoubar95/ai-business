CREATE TYPE "public"."task_log_author_type" AS ENUM('agent', 'human');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('backlog', 'in_progress', 'blocked', 'in_review', 'done');--> statement-breakpoint
CREATE TABLE "agent_archetypes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"soul_addendum" text DEFAULT '' NOT NULL,
	"tools_addendum" text DEFAULT '' NOT NULL,
	"heartbeat_addendum" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"filename" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mcp_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"mcp_credential_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"path" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"author_type" "task_log_author_type" NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"team_id" uuid,
	"agent_id" uuid,
	"parent_task_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "task_status" DEFAULT 'backlog' NOT NULL,
	"blocked_reason" text,
	"approval_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"cursor_api_key_encrypted" jsonb,
	"cursor_api_key_iv" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "archetype_id" uuid;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "github_repo_url" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "local_path" text;--> statement-breakpoint
ALTER TABLE "mcp_credentials" ADD COLUMN "business_id" uuid;--> statement-breakpoint
ALTER TABLE "agent_documents" ADD CONSTRAINT "agent_documents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_mcp_access" ADD CONSTRAINT "agent_mcp_access_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_mcp_access" ADD CONSTRAINT "agent_mcp_access_mcp_credential_id_mcp_credentials_id_fk" FOREIGN KEY ("mcp_credential_id") REFERENCES "public"."mcp_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_files" ADD CONSTRAINT "skill_files_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_logs" ADD CONSTRAINT "task_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approvals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_archetypes_slug_unique" ON "agent_archetypes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_documents_agent_id_slug_unique" ON "agent_documents" USING btree ("agent_id","slug");--> statement-breakpoint
CREATE INDEX "agent_documents_agent_id_idx" ON "agent_documents" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_mcp_access_agent_id_mcp_credential_id_unique" ON "agent_mcp_access" USING btree ("agent_id","mcp_credential_id");--> statement-breakpoint
CREATE INDEX "agent_mcp_access_agent_id_idx" ON "agent_mcp_access" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_mcp_access_mcp_credential_id_idx" ON "agent_mcp_access" USING btree ("mcp_credential_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_files_skill_id_path_unique" ON "skill_files" USING btree ("skill_id","path");--> statement-breakpoint
CREATE INDEX "skill_files_skill_id_idx" ON "skill_files" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "task_logs_task_id_idx" ON "task_logs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tasks_business_id_idx" ON "tasks" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "tasks_agent_id_idx" ON "tasks" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "tasks_team_id_idx" ON "tasks" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "tasks_parent_task_id_idx" ON "tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_settings_user_id_unique" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_archetype_id_agent_archetypes_id_fk" FOREIGN KEY ("archetype_id") REFERENCES "public"."agent_archetypes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_credentials" ADD CONSTRAINT "mcp_credentials_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_archetype_id_idx" ON "agents" USING btree ("archetype_id");--> statement-breakpoint
CREATE INDEX "mcp_credentials_business_id_idx" ON "mcp_credentials" USING btree ("business_id");--> statement-breakpoint

-- Phase 2 data migration (within same migration version): seed archetypes, copy legacy columns, MCP pivot prep.
INSERT INTO "agent_archetypes" ("slug", "name", "description", "soul_addendum", "tools_addendum", "heartbeat_addendum")
VALUES
  (
    'vertical-fullstack',
    'Vertical Full Stack Developer',
    'Takes a feature from top to bottom in one context window. Frontend and backend are one problem.',
    '',
    '',
    ''
  ),
  (
    'harness-engineer',
    'Harness Engineer',
    'Optimized for small context windows. Knows when to start a new session. Smart zone-aware. Writes tests on critical paths.',
    '',
    '',
    ''
  )
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

INSERT INTO "agent_documents" ("agent_id", "slug", "filename", "content", "created_at", "updated_at")
SELECT "id", 'soul', 'soul.md', COALESCE(NULLIF(trim("instructions"), ''), ''), "created_at", now()
FROM "agents"
ON CONFLICT ("agent_id", "slug") DO NOTHING;--> statement-breakpoint

INSERT INTO "agent_documents" ("agent_id", "slug", "filename", "content", "created_at", "updated_at")
SELECT "id", 'tools', 'tools.md', '', "created_at", now()
FROM "agents"
ON CONFLICT ("agent_id", "slug") DO NOTHING;--> statement-breakpoint

INSERT INTO "agent_documents" ("agent_id", "slug", "filename", "content", "created_at", "updated_at")
SELECT "id", 'heartbeat', 'heartbeat.md', '', "created_at", now()
FROM "agents"
ON CONFLICT ("agent_id", "slug") DO NOTHING;--> statement-breakpoint

INSERT INTO "skill_files" ("skill_id", "path", "content", "created_at")
SELECT "id", 'SKILL.md', COALESCE(NULLIF(trim("markdown"), ''), ''), "created_at"
FROM "skills"
ON CONFLICT ("skill_id", "path") DO NOTHING;--> statement-breakpoint

UPDATE "mcp_credentials" AS mc
SET "business_id" = a."business_id"
FROM "agents" AS a
WHERE mc."agent_id" = a."id";--> statement-breakpoint

INSERT INTO "agent_mcp_access" ("agent_id", "mcp_credential_id", "created_at")
SELECT mc."agent_id", mc."id", now()
FROM "mcp_credentials" AS mc
ON CONFLICT ("agent_id", "mcp_credential_id") DO NOTHING;