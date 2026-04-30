import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // Merge CI/local secrets into the dev server (DATABASE_URL + E2E_* are required
      // for full Grill-Me E2E; smoke tests omit DB).
      ...(process.env.DATABASE_URL && {
        DATABASE_URL: process.env.DATABASE_URL,
      }),
      ...(process.env.DATABASE_DIRECT_URL && {
        DATABASE_DIRECT_URL: process.env.DATABASE_DIRECT_URL,
      }),
      ...(process.env.E2E_EMAIL && { E2E_EMAIL: process.env.E2E_EMAIL }),
      ...(process.env.E2E_PASSWORD && {
        E2E_PASSWORD: process.env.E2E_PASSWORD,
      }),
      NEON_AUTH_BASE_URL:
        process.env.NEON_AUTH_BASE_URL ??
        "https://placeholder.invalid/neondb/auth",
      NEON_AUTH_COOKIE_SECRET:
        process.env.NEON_AUTH_COOKIE_SECRET ??
        "01234567890123456789012345678901",
      GRILL_ME_E2E_MOCK: process.env.GRILL_ME_E2E_MOCK ?? "1",
    },
  },
});
