/**
 * Cursor API key read path — plain module (not a Server Actions file) so the
 * decrypted key cannot be invoked from Client Components via action RPC.
 */
import { decryptCredential, type McpEncryptedPayload } from "@/lib/mcp/encryption";
import { getDb } from "@/db/index";
import { userBusinesses, userSettings } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { asc, eq } from "drizzle-orm";

/** Payload shape persisted in `user_settings.cursor_api_key_encrypted` (JSONB). */
const CURSOR_KEY_FIELD = "cursorApiKey";

function asEncryptedPayload(value: unknown): McpEncryptedPayload | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (
    typeof o.ciphertext === "string" &&
    typeof o.tag === "string" &&
    o.ciphertext &&
    o.tag
  ) {
    return { ciphertext: o.ciphertext, tag: o.tag };
  }
  return null;
}

function decryptStoredCursorPayload(
  ivBase64: string,
  encrypted: unknown,
): string | null {
  const payload = asEncryptedPayload(encrypted);
  if (!payload) return null;
  try {
    const decrypted = decryptCredential(ivBase64, payload) as Record<string, unknown>;
    if (typeof decrypted[CURSOR_KEY_FIELD] !== "string") return null;
    const key = (decrypted[CURSOR_KEY_FIELD] as string).trim();
    return key.length > 0 ? key : null;
  } catch {
    return null;
  }
}

/**
 * Reads the encrypted Cursor API key for a Neon Auth user id (no HTTP session required).
 * Used by local runner and workspace resolution across businesses.
 */
export async function getCursorApiKeyDecryptedForUserId(
  userId: string,
): Promise<string | null> {
  const db = getDb();
  const row = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
    columns: {
      cursorApiKeyEncrypted: true,
      cursorApiKeyIv: true,
    },
  });

  if (!row?.cursorApiKeyIv || row.cursorApiKeyEncrypted == null) {
    return null;
  }

  return decryptStoredCursorPayload(row.cursorApiKeyIv, row.cursorApiKeyEncrypted);
}

/**
 * First stored key among business members ordered by earliest `user_businesses` membership
 * (`created_at` ascending — typically onboarding order).
 */
export async function resolveCursorApiKeyForBusiness(
  businessId: string,
): Promise<string | null> {
  const db = getDb();
  const members = await db
    .select({ userId: userBusinesses.userId })
    .from(userBusinesses)
    .where(eq(userBusinesses.businessId, businessId))
    .orderBy(asc(userBusinesses.createdAt));

  for (const { userId } of members) {
    const key = await getCursorApiKeyDecryptedForUserId(userId);
    if (key) return key;
  }

  return null;
}

/** Server-only callers (`runHeartbeat`); session-scoped decryption. */
export async function getUserCursorApiKeyDecrypted(): Promise<string | null> {
  const userId = await requireSessionUserId();
  return getCursorApiKeyDecryptedForUserId(userId);
}
