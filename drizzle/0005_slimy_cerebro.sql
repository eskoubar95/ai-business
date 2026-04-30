-- Tenant-scoped composite FKs: unique (business_id, id) anchors + agent_mcp_access.business_id + tasks composite references.
CREATE UNIQUE INDEX "agents_business_id_id_unique" ON "agents" USING btree ("business_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_business_id_id_unique" ON "teams" USING btree ("business_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_credentials_business_id_id_unique" ON "mcp_credentials" USING btree ("business_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "approvals_business_id_id_unique" ON "approvals" USING btree ("business_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_business_id_id_unique" ON "tasks" USING btree ("business_id","id");--> statement-breakpoint
ALTER TABLE "agent_mcp_access" DROP CONSTRAINT "agent_mcp_access_agent_id_agents_id_fk";--> statement-breakpoint
ALTER TABLE "agent_mcp_access" DROP CONSTRAINT "agent_mcp_access_mcp_credential_id_mcp_credentials_id_fk";--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_team_id_teams_id_fk";--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_agent_id_agents_id_fk";--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_approval_id_approvals_id_fk";--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_parent_task_id_tasks_id_fk";--> statement-breakpoint
ALTER TABLE "agent_mcp_access" ADD COLUMN "business_id" uuid;--> statement-breakpoint
UPDATE "agent_mcp_access" AS ama SET "business_id" = a."business_id" FROM "agents" AS a WHERE ama."agent_id" = a."id";--> statement-breakpoint
DELETE FROM "agent_mcp_access" WHERE "business_id" IS NULL;--> statement-breakpoint
DELETE FROM "agent_mcp_access" AS ama WHERE EXISTS (SELECT 1 FROM "mcp_credentials" AS mc WHERE mc."id" = ama."mcp_credential_id" AND mc."business_id" IS DISTINCT FROM ama."business_id");--> statement-breakpoint
ALTER TABLE "agent_mcp_access" ALTER COLUMN "business_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_mcp_access" ADD CONSTRAINT "agent_mcp_access_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_mcp_access" ADD CONSTRAINT "agent_mcp_access_business_id_agent_id_agents_business_id_id_fk" FOREIGN KEY ("business_id","agent_id") REFERENCES "public"."agents"("business_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_mcp_access" ADD CONSTRAINT "agent_mcp_access_business_id_mcp_credential_id_mcp_credentials_business_id_id_fk" FOREIGN KEY ("business_id","mcp_credential_id") REFERENCES "public"."mcp_credentials"("business_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "approvals" AS a SET "business_id" = t."business_id" FROM "tasks" AS t WHERE t."approval_id" = a."id" AND a."business_id" IS NULL AND t."business_id" IS NOT NULL;--> statement-breakpoint
UPDATE "approvals" AS a SET "business_id" = ag."business_id" FROM "agents" AS ag WHERE a."agent_id" = ag."id" AND a."business_id" IS NULL;--> statement-breakpoint
UPDATE "tasks" SET "approval_id" = NULL WHERE "approval_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "approvals" ap WHERE ap."id" = "tasks"."approval_id" AND ap."business_id" = "tasks"."business_id");--> statement-breakpoint
UPDATE "tasks" SET "team_id" = NULL WHERE "team_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "teams" tm WHERE tm."id" = "tasks"."team_id" AND tm."business_id" = "tasks"."business_id");--> statement-breakpoint
UPDATE "tasks" SET "agent_id" = NULL WHERE "agent_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "agents" ag WHERE ag."id" = "tasks"."agent_id" AND ag."business_id" = "tasks"."business_id");--> statement-breakpoint
UPDATE "tasks" SET "parent_task_id" = NULL WHERE "parent_task_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "tasks" p WHERE p."id" = "tasks"."parent_task_id" AND p."business_id" = "tasks"."business_id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_business_id_team_id_teams_business_id_id_fk" FOREIGN KEY ("business_id","team_id") REFERENCES "public"."teams"("business_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_business_id_agent_id_agents_business_id_id_fk" FOREIGN KEY ("business_id","agent_id") REFERENCES "public"."agents"("business_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_business_id_parent_task_id_tasks_business_id_id_fk" FOREIGN KEY ("business_id","parent_task_id") REFERENCES "public"."tasks"("business_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_business_id_approval_id_approvals_business_id_id_fk" FOREIGN KEY ("business_id","approval_id") REFERENCES "public"."approvals"("business_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_mcp_access_business_id_idx" ON "agent_mcp_access" USING btree ("business_id");
