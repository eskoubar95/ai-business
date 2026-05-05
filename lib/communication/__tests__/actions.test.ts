import { beforeEach, describe, expect, it, vi } from "vitest";

const edgeMocks = vi.hoisted(() => ({
  upsertCommunicationEdge: vi.fn(),
  mergeSmartUpdateEdge: vi.fn(),
}));

vi.mock("@/lib/roster/session", () => ({
  requireSessionUserId: vi.fn(async () => "user-test"),
}));

vi.mock("@/lib/grill-me/access", () => ({
  assertUserBusinessAccess: vi.fn(async () => undefined),
}));

vi.mock("@/db/index", () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock("@/lib/communication/edge-store", () => ({
  upsertCommunicationEdge: edgeMocks.upsertCommunicationEdge,
  mergeSmartUpdateEdge: edgeMocks.mergeSmartUpdateEdge,
  deleteCommunicationEdge: vi.fn(),
  listCommunicationEdges: vi.fn(),
  getCommunicationEdgeById: vi.fn(),
}));

describe("communication server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createEdge validates input and upserts with null template lineage", async () => {
    edgeMocks.upsertCommunicationEdge.mockResolvedValue({
      id: "edge-1",
      businessId: "biz-1",
      fromRole: "a",
      toRole: "b",
      direction: "one_way",
      allowedIntents: ["notify_completion"],
      allowedArtifacts: ["ticket_ref"],
      requiresHumanAck: false,
      quotaPerHour: null,
      quotaMode: "warn_only",
      templateId: null,
      templateVersion: null,
      derivedFromTemplateId: null,
      derivedFromTemplateVersion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { createEdge } = await import("@/lib/communication/actions");
    const row = await createEdge("biz-1", {
      fromRole: "a",
      toRole: "b",
      direction: "one_way",
      allowedIntents: ["notify_completion"],
      allowedArtifacts: ["ticket_ref"],
      requiresHumanAck: false,
      quotaPerHour: null,
      quotaMode: "warn_only",
    });

    expect(row.id).toBe("edge-1");
    expect(edgeMocks.upsertCommunicationEdge).toHaveBeenCalledTimes(1);
    const [dbOrFirst, businessId, input, lineage] =
      edgeMocks.upsertCommunicationEdge.mock.calls[0] ?? [];
    expect(businessId).toBe("biz-1");
    expect(input).toMatchObject({
      fromRole: "a",
      toRole: "b",
      direction: "one_way",
    });
    expect(lineage).toEqual({
      templateId: null,
      templateVersion: null,
      derivedFromTemplateId: null,
      derivedFromTemplateVersion: null,
    });
    expect(dbOrFirst).toBeDefined();
  });

  it("updateEdge delegates to mergeSmartUpdateEdge", async () => {
    edgeMocks.mergeSmartUpdateEdge.mockResolvedValue({
      id: "edge-1",
      businessId: "biz-1",
      fromRole: "a",
      toRole: "b",
      direction: "bidirectional",
      allowedIntents: ["notify_completion"],
      allowedArtifacts: ["ticket_ref"],
      requiresHumanAck: false,
      quotaPerHour: 5,
      quotaMode: "warn_only",
      templateId: null,
      templateVersion: null,
      derivedFromTemplateId: null,
      derivedFromTemplateVersion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { updateEdge } = await import("@/lib/communication/actions");
    const row = await updateEdge("biz-1", "edge-1", { direction: "bidirectional" });

    expect(row?.direction).toBe("bidirectional");
    expect(edgeMocks.mergeSmartUpdateEdge).toHaveBeenCalledWith(
      expect.anything(),
      "biz-1",
      "edge-1",
      { direction: "bidirectional" },
    );
  });
});
