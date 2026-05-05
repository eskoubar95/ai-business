import { describe, expect, it } from "vitest";

import { isOrchestratorAuthorized, timingSafeSecretEqual } from "@/lib/communication/orchestrator-auth";

describe("orchestrator auth", () => {
  it("timingSafeSecretEqual matches equal secrets", () => {
    expect(timingSafeSecretEqual("abc", "abc")).toBe(true);
    expect(timingSafeSecretEqual("a", "b")).toBe(false);
  });

  it("isOrchestratorAuthorized is false when secret unset", () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer x" },
    });
    expect(isOrchestratorAuthorized(req, undefined)).toBe(false);
    expect(isOrchestratorAuthorized(req, "")).toBe(false);
  });

  it("isOrchestratorAuthorized accepts matching Bearer token", () => {
    const secret = "test-orchestrator-secret-value";
    const req = new Request("http://localhost", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    expect(isOrchestratorAuthorized(req, secret)).toBe(true);
  });

  it("isOrchestratorAuthorized rejects wrong token", () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer wrong" },
    });
    expect(isOrchestratorAuthorized(req, "right")).toBe(false);
  });

  it("isOrchestratorAuthorized rejects missing Bearer prefix", () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "Token x" },
    });
    expect(isOrchestratorAuthorized(req, "x")).toBe(false);
  });
});
