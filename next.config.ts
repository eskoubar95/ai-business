import type { NextConfig } from "next";
import path from "path";

/** Prefer this worktree lockfile when multiple package-lock.json files exist (nested git worktrees). */
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
