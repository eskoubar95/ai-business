import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export function getOrchestratorApiKey(): string | null {
  const k = process.env.ORCHESTRATOR_API_KEY?.trim();
  return k && k.length > 0 ? k : null;
}

/** Local dev only: allows unauthenticated spawn/job routes when no API key is set. Never use in production. */
export function orchestratorAuthAllowsInsecure(): boolean {
  return (
    process.env.ORCHESTRATOR_INSECURE_NO_AUTH === "1" && process.env.NODE_ENV !== "production"
  );
}

/**
 * Validates startup configuration for `listenOrchestrator` (CLI entry).
 * Production must set ORCHESTRATOR_API_KEY. Non-production without a key requires explicit insecure opt-in.
 */
export function assertOrchestratorConfiguredForListen(): void {
  if (getOrchestratorApiKey()) {
    return;
  }
  if (orchestratorAuthAllowsInsecure()) {
    console.warn(
      "[orchestrator] ORCHESTRATOR_INSECURE_NO_AUTH=1: POST /agent/spawn and GET /agent/:id accept requests without Authorization. Use only on trusted localhost.",
    );
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ORCHESTRATOR_API_KEY is required in production. Use a long random secret (e.g. openssl rand -hex 32).",
    );
  }
  throw new Error(
    "Set ORCHESTRATOR_API_KEY for the orchestrator, or for local dev only set ORCHESTRATOR_INSECURE_NO_AUTH=1 (never in production).",
  );
}

function extractBearer(req: IncomingMessage): string | null {
  const h = req.headers.authorization;
  if (!h || typeof h !== "string") {
    return null;
  }
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() ?? null;
}

/** `GET /health` is not protected (load balancers). Protect spawn and job status with this check. */
export function isOrchestratorRequestAuthorized(req: IncomingMessage): boolean {
  const expected = getOrchestratorApiKey();
  if (!expected) {
    return orchestratorAuthAllowsInsecure();
  }
  const got = extractBearer(req);
  if (got === null) {
    return false;
  }
  if (got.length !== expected.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(got, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}
