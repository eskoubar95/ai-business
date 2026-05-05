-- Manual rollback companion for migration 0010_right_blazing_skull.sql
-- NOT executed by drizzle-kit — run by an operator after backup + impact review only.
-- Order: drop dependent tables → strip new columns → drop enums.

BEGIN;

DROP TABLE IF EXISTS "communication_edges";
DROP TABLE IF EXISTS "gate_kinds";

ALTER TABLE "agents" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "agents" DROP COLUMN IF EXISTS "execution_adapter";
ALTER TABLE "agents" DROP COLUMN IF EXISTS "model_routing";
ALTER TABLE "agents" DROP COLUMN IF EXISTS "tier";

ALTER TABLE "businesses" DROP COLUMN IF EXISTS "template_id";
ALTER TABLE "businesses" DROP COLUMN IF EXISTS "template_version";
ALTER TABLE "businesses" DROP COLUMN IF EXISTS "derived_from_template_id";
ALTER TABLE "businesses" DROP COLUMN IF EXISTS "derived_from_template_version";

ALTER TABLE "teams" DROP COLUMN IF EXISTS "slug";

DROP TYPE IF EXISTS "execution_adapter";
DROP TYPE IF EXISTS "model_routing";

COMMIT;
