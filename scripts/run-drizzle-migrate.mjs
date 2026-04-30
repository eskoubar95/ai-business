/**
 * Apply Drizzle migrations using a TCP Postgres driver.
 *
 * drizzle-kit migrate uses @neondatabase/serverless in drizzle.config.ts, which
 * relies on WebSockets and often fails or exits non‑zero in CI when applying
 * sequential DDL. The app runtime still uses Neon HTTP/serverless via getDb().
 *
 * Env: prefers DATABASE_DIRECT_URL (trimmed, non-empty), else DATABASE_URL.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const direct = process.env.DATABASE_DIRECT_URL?.trim();
const pooled = process.env.DATABASE_URL?.trim();
const url = direct || pooled;

if (!url) {
  console.error(
    "run-drizzle-migrate: set DATABASE_URL or DATABASE_DIRECT_URL (non-empty).",
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
