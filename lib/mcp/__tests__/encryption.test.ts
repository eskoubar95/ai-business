import { afterEach, describe, expect, it } from "vitest";

import {
  decryptCredential,
  encryptCredential,
  loadEncryptionKeyFromEnv,
} from "../encryption.js";

const testKeyHex = "0123456789abcdef".repeat(4);

describe("MCP AES-256-GCM", () => {
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("rejects missing or invalid ENCRYPTION_KEY", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => loadEncryptionKeyFromEnv()).toThrow(/not set/);

    process.env.ENCRYPTION_KEY = "not-hex";
    expect(() => loadEncryptionKeyFromEnv()).toThrow(/64 hex/);

    process.env.ENCRYPTION_KEY = `${testKeyHex}a`;
    expect(() => loadEncryptionKeyFromEnv()).toThrow(/64 hex/);
  });

  it("round-trips a JSON payload", () => {
    process.env.ENCRYPTION_KEY = testKeyHex;
    const original = { notion: { token: "abc", workspace: "ws" } };

    const boxed = encryptCredential(original);
    expect(boxed.ivBase64.length).toBeGreaterThan(10);
    const back = decryptCredential(boxed.ivBase64, boxed.encryptedPayload);
    expect(back).toEqual(original);
  });
});
