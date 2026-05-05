import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

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
});
