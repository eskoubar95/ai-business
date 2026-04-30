-- Phase 2 — drop legacy columns after data backfill in 0003.
-- Dedupe MCP rows per (business_id, mcp_name), then pivot schema to business-only credentials.

WITH keeper AS (
  SELECT DISTINCT ON ("business_id", "mcp_name") "id" AS keeper_id, "business_id", "mcp_name"
  FROM "mcp_credentials"
  WHERE "business_id" IS NOT NULL
  ORDER BY "business_id", "mcp_name", "created_at" ASC, "id" ASC
),
dup_map AS (
  SELECT mc."id" AS old_id, k."keeper_id"
  FROM "mcp_credentials" mc
  INNER JOIN keeper k ON mc."business_id" = k."business_id" AND mc."mcp_name" = k."mcp_name"
  WHERE mc."id" <> k."keeper_id"
)
UPDATE "agent_mcp_access" AS ama
SET "mcp_credential_id" = dm."keeper_id"
FROM dup_map AS dm
WHERE ama."mcp_credential_id" = dm."old_id";--> statement-breakpoint

DELETE FROM "agent_mcp_access" AS a
WHERE EXISTS (
  SELECT 1 FROM "agent_mcp_access" AS b
  WHERE b."agent_id" = a."agent_id"
    AND b."mcp_credential_id" = a."mcp_credential_id"
    AND b."id" < a."id"
);--> statement-breakpoint

DELETE FROM "mcp_credentials" AS mc
USING (
  SELECT DISTINCT ON ("business_id", "mcp_name") "id" AS keeper_id, "business_id", "mcp_name"
  FROM "mcp_credentials"
  WHERE "business_id" IS NOT NULL
  ORDER BY "business_id", "mcp_name", "created_at" ASC, "id" ASC
) AS k
WHERE mc."business_id" = k."business_id"
  AND mc."mcp_name" = k."mcp_name"
  AND mc."id" <> k."keeper_id";--> statement-breakpoint

ALTER TABLE "mcp_credentials" DROP CONSTRAINT "mcp_credentials_agent_id_agents_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "mcp_credentials_agent_id_mcp_name_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "mcp_credentials_agent_id_idx";--> statement-breakpoint
ALTER TABLE "mcp_credentials" DROP COLUMN "agent_id";--> statement-breakpoint

ALTER TABLE "agents" DROP COLUMN "instructions";--> statement-breakpoint

ALTER TABLE "skills" DROP COLUMN "markdown";--> statement-breakpoint

ALTER TABLE "mcp_credentials" ALTER COLUMN "business_id" SET NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "mcp_credentials_business_id_mcp_name_unique"
  ON "mcp_credentials" USING btree ("business_id","mcp_name");
