import type { NextConfig } from "next";
import path from "node:path";

/** Prefer this worktree lockfile when multiple package-lock.json files exist (nested worktrees). */
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
