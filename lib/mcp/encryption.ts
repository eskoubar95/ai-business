import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** Shape persisted inside `mcp_credentials.encrypted_payload`. */
export type McpEncryptedPayload = {
  ciphertext: string;
  tag: string;
};

function normalizeEncryptionKeyHex(raw: string): string {
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function loadEncryptionKeyFromEnv(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw?.trim()) {
    throw new Error("ENCRYPTION_KEY is not set");
  }
  const hex = normalizeEncryptionKeyHex(raw);
  if (!/^[\da-fA-F]{64}$/.test(hex)) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). After trimming, length is ${hex.length}. Use: openssl rand -hex 32`,
    );
  }
  return Buffer.from(hex, "hex");
}

/** Encrypt a JSON-safe object using AES-256-GCM (IV excluded from ciphertext). */
export function encryptCredential(
  payloadObject: Record<string, unknown>,
): { ivBase64: string; encryptedPayload: McpEncryptedPayload } {
  const key = loadEncryptionKeyFromEnv();
  const iv = randomBytes(12);
  const plaintext = Buffer.from(JSON.stringify(payloadObject), "utf8");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ivBase64: iv.toString("base64"),
    encryptedPayload: {
      ciphertext: ciphertext.toString("base64"),
      tag: tag.toString("base64"),
    },
  };
}

/** Decrypt payload stored alongside base64 IV from `encryptCredential`. */
export function decryptCredential(
  ivBase64: string,
  encryptedPayload: McpEncryptedPayload,
): Record<string, unknown> {
  const key = loadEncryptionKeyFromEnv();
  const iv = Buffer.from(ivBase64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(Buffer.from(encryptedPayload.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encryptedPayload.ciphertext, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as Record<string, unknown>;
}
