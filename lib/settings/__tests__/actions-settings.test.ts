import { afterEach, describe, expect, it, vi } from "vitest";

import { decryptCredential } from "@/lib/mcp/encryption.js";

const testKeyHex = "0123456789abcdef".repeat(4);

const capture = vi.hoisted(() => ({
  lastInsert: null as null | {
    userId: string;
    cursorApiKeyEncrypted: { ciphertext: string; tag: string } | null;
    cursorApiKeyIv: string | null;
  },
}));

vi.mock("@/lib/roster/session", () => ({
  requireSessionUserId: vi.fn(async () => "user-phase2"),
}));

vi.mock("@/db/index", () => ({
  getDb: () => ({
    insert: () => ({
      values: (v: Record<string, unknown>) => {
        capture.lastInsert = {
          userId: String(v.userId),
          cursorApiKeyEncrypted:
            v.cursorApiKeyEncrypted != null
              ? (v.cursorApiKeyEncrypted as { ciphertext: string; tag: string })
              : null,
          cursorApiKeyIv: typeof v.cursorApiKeyIv === "string" ? v.cursorApiKeyIv : null,
        };
        return {
          onConflictDoUpdate: () => Promise.resolve(),
        };
      },
    }),
  }),
}));

describe("saveUserSettings encryption", () => {
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
    capture.lastInsert = null;
  });

  it("encrypts Cursor API key and supports round-trip with ENCRYPTION_KEY", async () => {
    process.env.ENCRYPTION_KEY = testKeyHex;

    const { saveUserSettings } = await import("@/lib/settings/actions.js");
    await saveUserSettings("  sk-test-secret  ");

    expect(capture.lastInsert?.userId).toBe("user-phase2");
    expect(capture.lastInsert?.cursorApiKeyIv?.length ?? 0).toBeGreaterThan(8);
    expect(capture.lastInsert?.cursorApiKeyEncrypted?.ciphertext).toBeTruthy();

    const decrypted = decryptCredential(capture.lastInsert!.cursorApiKeyIv!, capture.lastInsert!
      .cursorApiKeyEncrypted!);
    expect(decrypted.cursorApiKey).toBe("sk-test-secret");
  });
});
