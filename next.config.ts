import type { NextConfig } from "next";
import path from "node:path";

/** Prefer this worktree lockfile when multiple package-lock.json files exist (nested worktrees). */
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  /** Prevent bundling Cursor SDK (dynamic graph pulls .d.ts.map into webpack). */
  serverExternalPackages: ["@cursor/sdk"],
};

export default nextConfig;
