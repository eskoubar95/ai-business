import { createHmac, timingSafeEqual } from "node:crypto";

function requireSecret(secret?: string): string {
  const s = secret ?? process.env.WEBHOOK_SECRET;
  if (!s || !s.trim()) {
    throw new Error("WEBHOOK_SECRET is not set");
  }
  return s.trim();
}

/** Returns lowercase hex HMAC-SHA256 of the raw body / payload string. */
export function signPayload(payload: string | Buffer, secret?: string): string {
  const key = requireSecret(secret);
  const buf = typeof payload === "string" ? Buffer.from(payload, "utf8") : payload;
  return createHmac("sha256", key).update(buf).digest("hex");
}

/**
 * Verifies `signature` (hex) against HMAC-SHA256 of payload using constant-time comparison.
 */
export function verifySignature(
  payload: string | Buffer,
  signature: string,
  secret?: string,
): boolean {
  try {
    const expectedHex = signPayload(payload, secret);
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(signature.trim(), "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
