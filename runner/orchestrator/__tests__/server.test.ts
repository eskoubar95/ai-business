import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

vi.mock("@/runner/runpod/state-machine", () => ({
  getOrCreateDefaultRunpodInstance: vi.fn().mockResolvedValue({
    id: "runpod-1",
    slug: "default",
    state: "warm",
    lastActivityAt: new Date(),
    endpointUrl: null,
    lastFairShareBusinessId: null,
    updatedAt: new Date(),
  }),
  maybeShutdownTick: vi.fn().mockResolvedValue(undefined),
  recordRunpodActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/runner/queue/job-queue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/runner/queue/job-queue")>();
  return {
    ...actual,
    countQueuedJobs: vi.fn().mockResolvedValue(2),
    enqueueAgentJob: vi.fn(),
    fairShareNext: vi.fn().mockResolvedValue(null),
    markDone: vi.fn(),
    markFailed: vi.fn(),
    markInflight: vi.fn(),
  };
});

import { createOrchestratorServer } from "../server";

describe("orchestrator server", () => {
  let server: ReturnType<typeof createOrchestratorServer>;
  let port: number;

  beforeAll(async () => {
    server = createOrchestratorServer();
    await new Promise<void>((resolve, reject) => {
      server.listen(0, "127.0.0.1", () => resolve()).on("error", reject);
    });
    const addr = server.address();
    if (!addr || typeof addr === "string") {
      throw new Error("expected port");
    }
    port = addr.port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it("GET /health returns runpod_state and queue_depth", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.runpod_state).toBe("warm");
    expect(body.queue_depth).toBe(2);
  });

  it("POST /agent/spawn returns 401 without Bearer when ORCHESTRATOR_API_KEY is set", async () => {
    vi.stubEnv("ORCHESTRATOR_API_KEY", "orch-test-secret");
    vi.stubEnv("ORCHESTRATOR_INSECURE_NO_AUTH", "0");
    const res = await fetch(`http://127.0.0.1:${port}/agent/spawn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: randomUUID(),
        agent_slug: "test",
        adapter: "claude_code_cli",
        payload: {},
      }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("unauthorized");
    vi.unstubAllEnvs();
  });
});
