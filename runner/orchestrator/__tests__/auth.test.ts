import { describe, expect, it, vi } from "vitest";
import type { IncomingMessage } from "node:http";
import {
  getOrchestratorApiKey,
  isOrchestratorRequestAuthorized,
  orchestratorAuthAllowsInsecure,
} from "../auth";

function req(authorization?: string): IncomingMessage {
  return { headers: authorization ? { authorization } : {} } as IncomingMessage;
}

describe("orchestrator auth", () => {
  it("rejects missing bearer when API key is configured", () => {
    vi.stubEnv("ORCHESTRATOR_API_KEY", "secret-one");
    vi.stubEnv("ORCHESTRATOR_INSECURE_NO_AUTH", "0");
    expect(isOrchestratorRequestAuthorized(req())).toBe(false);
    expect(isOrchestratorRequestAuthorized(req("Basic xxx"))).toBe(false);
    vi.unstubAllEnvs();
  });

  it("accepts matching Bearer token (constant-time path)", () => {
    vi.stubEnv("ORCHESTRATOR_API_KEY", "secret-one");
    expect(isOrchestratorRequestAuthorized(req("Bearer secret-one"))).toBe(true);
    expect(isOrchestratorRequestAuthorized(req("bearer secret-one"))).toBe(true);
    expect(isOrchestratorRequestAuthorized(req("Bearer secret-two"))).toBe(false);
    vi.unstubAllEnvs();
  });

  it("insecure mode allows requests without bearer when no key is set (non-production)", () => {
    vi.stubEnv("ORCHESTRATOR_API_KEY", "");
    vi.stubEnv("ORCHESTRATOR_INSECURE_NO_AUTH", "1");
    vi.stubEnv("NODE_ENV", "development");
    expect(getOrchestratorApiKey()).toBeNull();
    expect(orchestratorAuthAllowsInsecure()).toBe(true);
    expect(isOrchestratorRequestAuthorized(req())).toBe(true);
    vi.unstubAllEnvs();
  });
});
