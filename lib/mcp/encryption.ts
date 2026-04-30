import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** Shape persisted inside `mcp_credentials.encrypted_payload`. */
export type McpEncryptedPayload = {
  ciphertext: string;
  tag: string;
};

export function loadEncryptionKeyFromEnv(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex?.trim()) {
    throw new Error("ENCRYPTION_KEY is not set");
  }
  if (!/^[\da-fA-F]{64}$/.test(hex)) {
    throw new Error("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes AES-256 key)");
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
