import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

/** Prefer this worktree lockfile when multiple package-lock.json files exist (nested worktrees). */
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  /** Prevent bundling Cursor SDK (dynamic graph pulls .d.ts.map into webpack). */
  serverExternalPackages: ["@cursor/sdk"],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
