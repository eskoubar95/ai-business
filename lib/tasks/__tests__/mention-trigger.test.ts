import { beforeEach, describe, expect, it, vi } from "vitest";

const logEvent = vi.hoisted(() =>
  vi.fn(async () => {
    return "evt-1";
  }),
);

vi.mock("@/lib/orchestration/events", () => ({
  logEvent,
}));

const findManyAgents = vi.hoisted(() =>
  vi.fn(async () => [{ id: "agent-alice" }]),
);

vi.mock("@/db/index", () => ({
  getDb() {
    return {
      query: {
        agents: {
          findMany: findManyAgents,
        },
      },
    };
  },
}));

import { extractMentionHandles, parseAndTriggerMentions } from "../mention-trigger";

describe("mention-trigger", () => {
  beforeEach(() => {
    logEvent.mockClear();
    findManyAgents.mockResolvedValue([{ id: "agent-alice" }]);
  });

  it("extractMentionHandles dedupes case-insensitively", () => {
    expect(extractMentionHandles("Ping @Alice and @alice once")).toEqual(["Alice"]);
  });

  it("parseAndTriggerMentions writes mention_trigger for matching agent", async () => {
    await parseAndTriggerMentions("task-1", "@alice review this", "biz-1");
    expect(findManyAgents).toHaveBeenCalled();
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "mention_trigger",
        businessId: "biz-1",
        status: "pending",
        payload: expect.objectContaining({
          agentId: "agent-alice",
          taskId: "task-1",
          trigger: "mention",
        }),
      }),
    );
  });
});
