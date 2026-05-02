import { config } from "dotenv";
import { resolve } from "node:path";

/** Load DATABASE_URL etc. without Next.js (same precedence as Drizzle CLI). */
export function loadRunnerEnv(): void {
  config({ path: resolve(process.cwd(), ".env") });
  config({ path: resolve(process.cwd(), ".env.local"), override: true });
}
