# Scripts

## `run-drizzle-migrate.mjs`

Runs Drizzle migrations from `./drizzle` using the **`postgres`** TCP client (see `package.json` script **`npm run db:migrate`**). Prefer **`DATABASE_DIRECT_URL`** for Neon when available; otherwise **`DATABASE_URL`**.

The Next.js app continues to use Neon HTTP via `getDb()`; this script is only for applying versioned SQL migrations reliably (including in CI).
