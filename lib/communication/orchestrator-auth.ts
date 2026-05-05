import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time compare for secrets of arbitrary length (SHA-256 digest compare). */
export function timingSafeSecretEqual(provided: string, expected: string): boolean {
  const ha = createHash("sha256").update(provided, "utf8").digest();
  const hb = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/**
 * True when `Authorization: Bearer <token>` matches `COMMUNICATION_ORCHESTRATOR_SECRET`.
 * If the env secret is unset/empty, always false (session auth only).
 */
export function isOrchestratorAuthorized(req: Request, secret: string | undefined): boolean {
  if (typeof secret !== "string" || secret.length === 0) {
    return false;
  }
  const raw = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!raw?.startsWith("Bearer ")) {
    return false;
  }
  const token = raw.slice("Bearer ".length).trim();
  if (!token) {
    return false;
  }
  return timingSafeSecretEqual(token, secret);
}
