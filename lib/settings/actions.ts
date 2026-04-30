"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { getDb } from "@/db/index";
import { businesses, userSettings } from "@/db/schema";
import { requireSessionUserId } from "@/lib/roster/session";
import { encryptCredential } from "@/lib/mcp/encryption";
import { eq } from "drizzle-orm";

/** Payload field name inside encrypted JSON `{ cursorApiKey: string }`. */
const CURSOR_KEY_FIELD = "cursorApiKey";

/**
 * Persist the user's Cursor API key (AES-256-GCM, shared pattern with MCP credentials).
 * Pass an empty string to clear stored credentials.
 */
export async function saveUserSettings(cursorApiKey: string): Promise<{ success: true }> {
  const userId = await requireSessionUserId();
  const db = getDb();
  const trimmed = cursorApiKey.trim();
  const now = new Date();

  if (!trimmed) {
    await db
      .insert(userSettings)
      .values({
        userId,
        cursorApiKeyEncrypted: null,
        cursorApiKeyIv: null,
      })
      .onConflictDoUpdate({
        target: [userSettings.userId],
        set: {
          cursorApiKeyEncrypted: null,
          cursorApiKeyIv: null,
          updatedAt: now,
        },
      });
    return { success: true };
  }

  const envelope = encryptCredential({ [CURSOR_KEY_FIELD]: trimmed });

  await db
    .insert(userSettings)
    .values({
      userId,
      cursorApiKeyEncrypted: envelope.encryptedPayload,
      cursorApiKeyIv: envelope.ivBase64,
    })
    .onConflictDoUpdate({
      target: [userSettings.userId],
      set: {
        cursorApiKeyEncrypted: envelope.encryptedPayload,
        cursorApiKeyIv: envelope.ivBase64,
        updatedAt: now,
      },
    });

  return { success: true };
}

export async function saveBusinessSettings(
  businessId: string,
  data: { localPath?: string; githubRepoUrl?: string; description?: string },
): Promise<{ success: true }> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const db = getDb();
  await db
    .update(businesses)
    .set({
      ...(data.localPath !== undefined ? { localPath: data.localPath.trim() || null } : {}),
      ...(data.githubRepoUrl !== undefined
        ? { githubRepoUrl: data.githubRepoUrl.trim() || null }
        : {}),
      ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
    })
    .where(eq(businesses.id, businessId));

  return { success: true };
}
