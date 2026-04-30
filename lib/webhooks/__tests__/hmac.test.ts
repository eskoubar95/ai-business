import { describe, expect, it } from "vitest";

import { signPayload, verifySignature } from "@/lib/webhooks/hmac";

describe("hmac", () => {
  it("signs and verifies payload with timing-safe path", () => {
    const secret = "test-secret-value";
    const body = '{"hello":"world"}';
    const sig = signPayload(body, secret);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(verifySignature(body, sig, secret)).toBe(true);
    expect(verifySignature(body + "x", sig, secret)).toBe(false);
    expect(verifySignature(body, sig, "wrong")).toBe(false);
  });
});
