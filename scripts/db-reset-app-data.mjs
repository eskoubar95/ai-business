#!/usr/bin/env node
/**
 * Wipes all tenant-linked app rows so you can redo onboarding locally.
 *
 * Preserves:
 * - `user_settings` (encrypted Cursor API key per Neon Auth user)
 * - `agent_archetypes` (platform presets)
 * - `system_roles` (platform roles from migrations)
 *
 * Requires explicit opt-in: ALLOW_APP_DATA_RESET=1 (see `.env.example`).
 *
 * Usage (from repo root):
 *   ALLOW_APP_DATA_RESET=1 npm run db:reset-app-data
 *
 * Uses the same TCP URL resolution as migrations (DATABASE_DIRECT_URL, else DATABASE_URL).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

function pickSqlUrl() {
  const candidates = [
    process.env.DATABASE_DIRECT_URL?.trim(),
    process.env.DATABASE_URL?.trim(),
  ].filter(Boolean);

  for (const raw of candidates) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "postgres:" && u.protocol !== "postgresql:") continue;
      return raw;
    } catch {
      /* skip */
    }
  }
  return null;
}

if (process.env.ALLOW_APP_DATA_RESET !== "1") {
  console.error(
    "Refusing to run: set ALLOW_APP_DATA_RESET=1 in the environment after backing up anything you care about.",
  );
  process.exit(1);
}

const url = pickSqlUrl();
if (!url) {
  console.error("Missing DATABASE_DIRECT_URL / DATABASE_URL (valid postgres URL).");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  // CASCADE truncates dependents (agents, tasks, MCP, approvals, webhook rows, Grill-Me, etc.).
  // Does not truncate user_settings, agent_archetypes, or system_roles.
  await sql`TRUNCATE TABLE businesses CASCADE`;
  console.log("OK — businesses and dependent rows truncated. Restart dev and visit /onboarding.");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
