/**
 * Idempotent seed: upserts launch archetypes by `slug`.
 *
 * Env: loads `.env` then `.env.local` (same order as `drizzle.config.ts`).
 * URL: prefers DATABASE_DIRECT_URL, then DATABASE_URL (valid postgres: URLs only).
 *
 * Run: `npm run db:seed`
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { agentArchetypes } from "@/db/schema";
import { LAUNCH_ARCHETYPE_ROWS } from "@/db/seeds/archetype-rows";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

function pickMigrateUrl(): string | null {
  const candidates = [
    process.env.DATABASE_DIRECT_URL?.trim(),
    process.env.DATABASE_URL?.trim(),
  ].filter((v): v is string => typeof v === "string" && v.length > 0);

  for (const raw of candidates) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "postgres:" && u.protocol !== "postgresql:") continue;
      return raw;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function main() {
  const url = pickMigrateUrl();
  if (!url) {
    console.error(
      "db:seed: need a valid postgres:// URL in DATABASE_URL or DATABASE_DIRECT_URL.",
    );
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  try {
    for (const row of LAUNCH_ARCHETYPE_ROWS) {
      await db
        .insert(agentArchetypes)
        .values(row)
        .onConflictDoUpdate({
          target: agentArchetypes.slug,
          set: {
            name: row.name,
            description: row.description,
            soulAddendum: row.soulAddendum,
            toolsAddendum: row.toolsAddendum,
            heartbeatAddendum: row.heartbeatAddendum,
          },
        });
    }
    console.log(`Seeded ${LAUNCH_ARCHETYPE_ROWS.length} archetype(s).`);
  } finally {
    await sql.end({ timeout: 10 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
