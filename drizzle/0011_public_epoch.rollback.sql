-- Manual rollback companion for migration 0011_public_epoch.sql
-- NOT executed by drizzle-kit — run by an operator after backup + impact review only.

BEGIN;

DROP TABLE IF EXISTS "agent_jobs";
DROP TABLE IF EXISTS "runpod_instances";

DROP TYPE IF EXISTS "agent_job_status";
DROP TYPE IF EXISTS "runpod_instance_state";

COMMIT;
