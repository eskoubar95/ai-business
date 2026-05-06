import { describe, expect, it } from "vitest";

import {
  MAX_AGENT_AVATAR_BYTES,
  assertValidAgentAvatarUrl,
  maxAvatarUploadFileBytes,
  normalizeAgentIconKeyForSave,
} from "@/lib/agents/avatar-validation";

describe("avatar-validation", () => {
  it("allows https avatars", () => {
    expect(() =>
      assertValidAgentAvatarUrl("https://cdn.example/logo.png"),
    ).not.toThrow();
  });

  it("allows small data URLs", () => {
    const b64 = Buffer.from("x").toString("base64");
    expect(() => assertValidAgentAvatarUrl(`data:image/png;base64,${b64}`)).not.toThrow();
    expect(() => assertValidAgentAvatarUrl(`data:image/JPEG;base64,${b64}`)).not.toThrow();
  });

  it("rejects inline SVG payloads", () => {
    expect(() =>
      assertValidAgentAvatarUrl("data:image/svg+xml;base64,PHRydWU+"),
    ).toThrow(/SVG not allowed/i);
  });

  it("rejects image data URLs without base64", () => {
    expect(() => assertValidAgentAvatarUrl("data:image/png;charset=utf-8,huh")).toThrow(/base64/);
  });

  it("computes conservative raw-upload ceiling vs stored budget", () => {
    const raw = maxAvatarUploadFileBytes();
    expect(raw).toBeLessThan(MAX_AGENT_AVATAR_BYTES);
    expect(raw).toBeGreaterThan(1_400_000);
  });

  it("rejects oversized data URLs", () => {
    const enc = new TextEncoder();
    const prefix = "data:image/png;base64,x";
    const fillerLen = MAX_AGENT_AVATAR_BYTES + 1 - enc.encode(prefix).length;
    const oversized = `${prefix}${"y".repeat(Math.max(fillerLen, 1))}`;
    expect(enc.encode(oversized).length).toBeGreaterThan(MAX_AGENT_AVATAR_BYTES);
    expect(() => assertValidAgentAvatarUrl(oversized)).toThrow(/exceeds/);
  });

  it("normalises icon keys", () => {
    expect(normalizeAgentIconKeyForSave("shield")).toBe("shield");
    expect(normalizeAgentIconKeyForSave(null)).toBe(null);
    expect(() => normalizeAgentIconKeyForSave("nope")).toThrow(/allowlist/);
  });
});
