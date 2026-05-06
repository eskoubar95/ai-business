import { describe, expect, it } from "vitest";

import {
  MAX_AGENT_AVATAR_BYTES,
  assertValidAgentAvatarUrl,
  normalizeAgentIconKeyForSave,
} from "@/lib/agents/avatar-validation";

describe("avatar-validation", () => {
  it("allows https avatars", () => {
    expect(() =>
      assertValidAgentAvatarUrl("https://cdn.example/logo.png"),
    ).not.toThrow();
  });

  it("allows small data URLs", () => {
    expect(() => assertValidAgentAvatarUrl(`data:image/png;base64,${btoa("x")}`)).not.toThrow();
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
