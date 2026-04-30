/**
 * Apply Drizzle migrations using a TCP Postgres driver.
 *
 * drizzle-kit migrate uses @neondatabase/serverless in drizzle.config.ts, which
 * relies on WebSockets and often fails or exits non‑zero in CI when applying
 * sequential DDL. The app runtime still uses Neon HTTP/serverless via getDb().
 *
 * Env: tries DATABASE_DIRECT_URL first, then DATABASE_URL. Invalid / placeholder
 * secrets (common when DATABASE_DIRECT_URL exists but is misconfigured) are
 * skipped so a valid pooled DATABASE_URL can still run migrations.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

function pickMigrateUrl() {
  const candidates = [
    process.env.DATABASE_DIRECT_URL?.trim(),
    process.env.DATABASE_URL?.trim(),
  ].filter(Boolean);

  for (const raw of candidates) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "postgres:" && u.protocol !== "postgresql:") {
        continue;
      }
      return raw;
    } catch {
      /* invalid URL — try next candidate */
    }
  }
  return null;
}

const url = pickMigrateUrl();

if (!url) {
  console.error(
    "run-drizzle-migrate: need a valid postgres:// or postgresql:// URL in DATABASE_URL or DATABASE_DIRECT_URL.",
  );
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
const db = drizzle(sql);

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
} finally {
  await sql.end({ timeout: 10 });
}
