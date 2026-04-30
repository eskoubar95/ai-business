/**
 * Cursor API key read path — plain module (not a Server Actions file) so the
 * decrypted key cannot be invoked from Client Components via action RPC.
 */
import { decryptCredential, type McpEncryptedPayload } from "@/lib/mcp/encryption";
import { getDb } from "@/db/index";
import { userSettings } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { eq } from "drizzle-orm";

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

/** Server-only callers (`runHeartbeat`); session-scoped decryption. */
export async function getUserCursorApiKeyDecrypted(): Promise<string | null> {
  const userId = await requireSessionUserId();
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

  const payload = asEncryptedPayload(row.cursorApiKeyEncrypted);
  if (!payload) return null;

  try {
    const decrypted = decryptCredential(row.cursorApiKeyIv, payload) as Record<string, unknown>;
    if (typeof decrypted[CURSOR_KEY_FIELD] !== "string") return null;
    const key = (decrypted[CURSOR_KEY_FIELD] as string).trim();
    return key.length > 0 ? key : null;
  } catch {
    return null;
  }
}
