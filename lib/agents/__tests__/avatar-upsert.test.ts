import { describe, expect, it } from "vitest";

import { resolveAvatarColumnsForUpsert } from "@/lib/agents/avatar-upsert";

describe("resolveAvatarColumnsForUpsert", () => {
  it("returns null when neither field patched", () => {
    expect(resolveAvatarColumnsForUpsert({})).toBe(null);
  });

  it("clears avatar URL", () => {
    expect(resolveAvatarColumnsForUpsert({ avatarUrl: null })).toEqual({ avatarUrl: null });
    expect(resolveAvatarColumnsForUpsert({ avatarUrl: "" })).toEqual({ avatarUrl: null });
  });

  it("persists trimmed https URL", () => {
    const r = resolveAvatarColumnsForUpsert({
      avatarUrl: " https://cdn.example/logo.png ",
    });
    expect(r).toEqual({ avatarUrl: "https://cdn.example/logo.png" });
  });

  it("validates and keeps allowed data URL payload", () => {
    const b64 = Buffer.from("x").toString("base64");
    const r = resolveAvatarColumnsForUpsert({
      avatarUrl: `data:image/png;base64,${b64}`,
    });
    expect(r?.avatarUrl?.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("rejects bad icon keys before DB", () => {
    expect(() => resolveAvatarColumnsForUpsert({ iconKey: "bogus" })).toThrow(/allowlist/);
  });

  it("combines avatar and icon", () => {
    const r = resolveAvatarColumnsForUpsert({
      avatarUrl: "https://a.example/img.png",
      iconKey: "brain",
    });
    expect(r).toEqual({
      avatarUrl: "https://a.example/img.png",
      iconKey: "brain",
    });
  });
});
