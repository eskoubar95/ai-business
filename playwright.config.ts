import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Same precedence as Drizzle/Next: `.env` then `.env.local` (so `npm run test:e2e` sees DATABASE_URL + Neon Auth).
loadEnv({ path: resolve(process.cwd(), ".env") });
if (existsSync(resolve(process.cwd(), ".env.local"))) {
  loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Grill-Me + agents suites both hit Server Actions and DB; parallel workers overload local dev and leave transitions pending.
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Webpack dev avoids Turbopack + Server Actions quirks in automated browser tests.
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    // Inherits full `process.env` (including values loaded above). Only set E2E-specific defaults.
    // Never inject fake Neon Auth here: it overrides Next.js reading `.env.local` and breaks Server Actions.
    env: {
      GRILL_ME_E2E_MOCK: process.env.GRILL_ME_E2E_MOCK ?? "1",
    },
  },
});
