import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstMock = vi.fn();
const findManyMock = vi.fn();
const updateMock = vi.fn();
const insertMock = vi.fn();

vi.mock("@/lib/agents/actions", () => ({
  assertUserOwnsAgent: vi.fn(async () => ({ userId: "u1", businessId: "b1" })),
}));

vi.mock("@/db/index", () => ({
  getDb() {
    return {
      query: {
        agentDocuments: {
          findFirst: findFirstMock,
          findMany: findManyMock,
        },
      },
      update: updateMock,
      insert: insertMock,
    };
  },
}));

import {
  getAgentDocuments,
  updateAgentDocument,
} from "@/lib/agents/document-actions.js";

describe("getAgentDocuments", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns three slugs with defaults when rows are missing", async () => {
    findManyMock.mockResolvedValueOnce([
      { slug: "soul", content: "A", filename: "soul.md" },
    ]);
    const docs = await getAgentDocuments("agent-1");
    expect(docs).toHaveLength(3);
    expect(docs.find((d) => d.slug === "soul")?.content).toBe("A");
    expect(docs.find((d) => d.slug === "tools")?.content).toBe("");
    expect(docs.find((d) => d.slug === "heartbeat")?.content).toBe("");
  });
});

describe("updateAgentDocument", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
    insertMock.mockReset();
  });

  it("rejects invalid slug", async () => {
    await expect(updateAgentDocument("agent-1", "nope", "x")).rejects.toThrow(
      "Invalid document slug",
    );
  });

  it("updates existing row", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "doc-1" });
    updateMock.mockReturnValue({
      set: () => ({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    await updateAgentDocument("agent-1", "tools", "## tools");
    expect(updateMock).toHaveBeenCalled();
  });

  it("inserts when row missing", async () => {
    findFirstMock.mockResolvedValueOnce(undefined);
    insertMock.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    await updateAgentDocument("agent-1", "heartbeat", "## hb");
    expect(insertMock).toHaveBeenCalled();
  });
});
