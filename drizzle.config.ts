import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

// Match Next env precedence: `.env` then `.env.local` wins (DATABASE_URL lives in `.env.local`).
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    /** Optional direct Neon URL when pooled `DATABASE_URL` fails for Drizzle CLI; see `.cursor/rules/database-architecture.mdc`. */
    url: (process.env.DATABASE_DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim())!,
  },
});
