import {
  Cursor,
  AuthenticationError,
  CursorSdkError,
  NetworkError,
  RateLimitError,
} from "@cursor/sdk";

export type CursorKeyVerifyReason =
  | "invalid_credentials"
  | "rate_limited"
  | "network"
  | "unknown";

export type CursorApiKeyVerificationResult =
  | { ok: true }
  | { ok: false; reason: CursorKeyVerifyReason };

function isProbablyAuthFailure(e: unknown): boolean {
  if (e instanceof AuthenticationError) return true;
  return e instanceof CursorSdkError && e.status === 401;
}

function isProbablyRateLimited(e: unknown): boolean {
  if (e instanceof RateLimitError) return true;
  return e instanceof CursorSdkError && e.status === 429;
}

function isProbablyNetwork(e: unknown): boolean {
  return e instanceof NetworkError;
}

/**
 * Confirms the key with Cursor (`Cursor.me`) — no agent run.
 * Production always hits the API. `CURSOR_API_VERIFY_SKIP=1` skips only when `NODE_ENV !== "production"` (local E2E / plumbing).
 */
export async function verifyCursorApiKey(
  apiKey: string,
): Promise<CursorApiKeyVerificationResult> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { ok: false, reason: "invalid_credentials" };
  }

  if (
    process.env.CURSOR_API_VERIFY_SKIP === "1" &&
    process.env.NODE_ENV !== "production"
  ) {
    return { ok: true };
  }

  try {
    await Cursor.me({ apiKey: trimmed });
    return { ok: true };
  } catch (e: unknown) {
    if (isProbablyAuthFailure(e)) {
      return { ok: false, reason: "invalid_credentials" };
    }
    if (isProbablyRateLimited(e)) {
      return { ok: false, reason: "rate_limited" };
    }
    if (isProbablyNetwork(e)) {
      return { ok: false, reason: "network" };
    }
    return { ok: false, reason: "unknown" };
  }
}
