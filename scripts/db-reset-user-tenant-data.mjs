#!/usr/bin/env node
/**
 * Removes app tenant data for one Neon Auth user so they can redo onboarding.
 *
 * - Deletes businesses where this user is the **only** member (`DELETE` cascades to agents, tasks, etc.).
 * - For businesses shared with other users, only removes this user's `user_businesses` row.
 * - Deletes this user's `user_settings` row (encrypted Cursor key — they can re-add in Settings).
 *
 * Does **not** delete the Neon Auth account.
 *
 * Opt-in:
 *   ALLOW_USER_TENANT_RESET=1
 * And one of:
 *   RESET_USER_EMAIL=user@example.com
 *   RESET_USER_ID=<neon auth user id string>
 *
 * Usage (from repo root, with `.env` / `.env.local` loaded like other db scripts):
 *   ALLOW_USER_TENANT_RESET=1 RESET_USER_EMAIL=you@example.com npm run db:reset-user-tenant-data
 *
 * Uses DATABASE_DIRECT_URL when set, else DATABASE_URL (same as `db-reset-app-data.mjs`).
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

if (process.env.ALLOW_USER_TENANT_RESET !== "1") {
  console.error(
    "Refusing to run: set ALLOW_USER_TENANT_RESET=1 after confirming the target user/email is correct.",
  );
  process.exit(1);
}

const emailRaw = process.env.RESET_USER_EMAIL?.trim();
const userIdRaw = process.env.RESET_USER_ID?.trim();

if (!emailRaw && !userIdRaw) {
  console.error("Set RESET_USER_EMAIL or RESET_USER_ID.");
  process.exit(1);
}

const url = pickSqlUrl();
if (!url) {
  console.error("Missing DATABASE_DIRECT_URL / DATABASE_URL (valid postgres URL).");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function resolveUserIdByEmail(email) {
  const attempts = [
    () =>
      sql`
        SELECT id FROM "user"
        WHERE lower(email) = lower(${email})
        LIMIT 1
      `,
    () =>
      sql`
        SELECT id FROM neon_auth."user"
        WHERE lower(email) = lower(${email})
        LIMIT 1
      `,
  ];

  for (const run of attempts) {
    try {
      const rows = await run();
      if (rows.length > 0) return String(rows[0].id);
    } catch {
      /* table or schema missing */
    }
  }
  return null;
}

try {
  let userId = userIdRaw ?? null;
  if (!userId && emailRaw) {
    userId = await resolveUserIdByEmail(emailRaw);
    if (!userId) {
      console.error(
        `Could not resolve user id for email (checked public."user" and neon_auth."user"). Set RESET_USER_ID manually from Neon or your session.`,
      );
      process.exit(1);
    }
    console.log(`Resolved RESET_USER_EMAIL → user id ${userId}`);
  }

  const links = await sql`
    SELECT business_id FROM user_businesses WHERE user_id = ${userId}
  `;

  if (links.length === 0) {
    await sql`DELETE FROM user_settings WHERE user_id = ${userId}`;
    console.log("No user_businesses rows — removed user_settings if any. Nothing else to delete.");
    process.exit(0);
  }

  let deletedBusinesses = 0;
  let unlinkedShared = 0;

  for (const row of links) {
    const bid = row.business_id;
    const mcRows = await sql`
      SELECT count(*)::int AS count FROM user_businesses WHERE business_id = ${bid}
    `;
    const memberCount = mcRows[0]?.count ?? 0;
    if (memberCount <= 1) {
      await sql`DELETE FROM businesses WHERE id = ${bid}`;
      deletedBusinesses++;
    } else {
      await sql`
        DELETE FROM user_businesses
        WHERE user_id = ${userId} AND business_id = ${bid}
      `;
      unlinkedShared++;
    }
  }

  await sql`DELETE FROM user_settings WHERE user_id = ${userId}`;

  console.log(
    `OK — user ${userId}: deleted ${deletedBusinesses} sole-owned business(es), unlinked ${unlinkedShared} shared business(es), cleared user_settings.`,
  );
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
