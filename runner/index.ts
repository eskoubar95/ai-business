import { loadRunnerEnv } from "./bootstrap-env";

loadRunnerEnv();

import { pollOnce } from "./poll";

const INTERVAL_MS = 10_000;

function getApiKey(): string {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key) {
    console.error(
      "[runner] CURSOR_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
    process.exit(1);
  }
  return key;
}

async function tick() {
  try {
    await pollOnce(getApiKey());
  } catch (e) {
    console.error("[runner] poll error:", e instanceof Error ? e.message : e);
  }
}

void tick().then(() => {
  console.info(`[runner] Polling every ${INTERVAL_MS / 1000}s (Ctrl+C to stop)`);
});
setInterval(tick, INTERVAL_MS);
