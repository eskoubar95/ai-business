import { beforeEach, describe, expect, it, vi } from "vitest";

const parseAndTriggerMentions = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("../mention-trigger", () => ({
  parseAndTriggerMentions,
}));

vi.mock("@/lib/roster/session", () => ({
  requireSessionUserId: vi.fn(async () => "user-1"),
}));

vi.mock("@/lib/grill-me/access", () => ({
  assertUserBusinessAccess: vi.fn(async () => {}),
}));

const mockDb = vi.hoisted(() => ({
  insert: vi.fn(),
  query: {
    tasks: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/db/index", () => ({
  getDb: () => mockDb,
}));

import { appendTaskLog } from "../log-actions";

describe("log-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.query.tasks.findFirst.mockResolvedValue({ businessId: "b1" });
    mockDb.insert.mockReturnValue({
      values: () => ({
        returning: vi.fn(async () => [{ id: "log-1" }]),
      }),
    });
  });

  it("appendTaskLog invokes parseAndTriggerMentions for human authors", async () => {
    await appendTaskLog("task-1", "@alice hi", "human", "user-1");
    expect(parseAndTriggerMentions).toHaveBeenCalledWith("task-1", "@alice hi", "b1");
  });

  it("appendTaskLog skips mentions for agent authors", async () => {
    await appendTaskLog("task-1", "@alice hi", "agent", "agent-1");
    expect(parseAndTriggerMentions).not.toHaveBeenCalled();
  });
});
