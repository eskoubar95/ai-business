import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  approvals: [] as Array<{
    id: string;
    businessId: string;
    agentId: string | null;
    artifactRef: Record<string, unknown>;
    approvalStatus: string;
    comment: string | null;
    decidedAt: Date | null;
    updatedAt: Date;
  }>,
  events: [] as Array<{ type: string; payload: Record<string, unknown> }>,
}));

const findFirstApproval = vi.hoisted(() =>
  vi.fn(async () => store.approvals[0] ?? null),
);

vi.mock("@/lib/roster/session", () => ({
  requireSessionUserId: vi.fn(async () => "user-1"),
}));

vi.mock("@/lib/grill-me/access", () => ({
  assertUserBusinessAccess: vi.fn(async () => {}),
}));

const logAgentLifecycleStatus = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/orchestration/events", () => ({
  logEvent: vi.fn(async (input: { type: string; payload: Record<string, unknown> }) => {
    store.events.push({ type: input.type, payload: input.payload });
    return "e1";
  }),
  logAgentLifecycleStatus,
}));

vi.mock("@/db/index", () => ({
  getDb() {
    return {
      insert() {
        return {
          values: (vals: Record<string, unknown>) => ({
            returning: vi.fn(async () => {
              const id = `appr-${store.approvals.length + 1}`;
              store.approvals.push({
                id,
                businessId: vals.businessId as string,
                agentId: (vals.agentId as string | null) ?? null,
                artifactRef: vals.artifactRef as Record<string, unknown>,
                approvalStatus: vals.approvalStatus as string,
                comment: null,
                decidedAt: null,
                updatedAt: new Date(),
              });
              return [{ id }];
            }),
          }),
        };
      },
      update() {
        return {
          set: (patch: Record<string, unknown>) => ({
            where: vi.fn(async () => {
              const target = store.approvals[0];
              if (target) Object.assign(target, patch);
            }),
          }),
        };
      },
      query: {
        approvals: {
          findFirst: findFirstApproval,
        },
      },
    };
  },
}));

import { approveArtifact, createApproval, rejectArtifact } from "@/lib/approvals/actions";

describe("approvals actions", () => {
  beforeEach(() => {
    store.approvals.length = 0;
    store.events.length = 0;
    logAgentLifecycleStatus.mockClear();
    findFirstApproval.mockImplementation(async () => store.approvals[0] ?? null);
  });

  it("createApproval logs lifecycle awaiting_approval when agentId set", async () => {
    const { logEvent } = await import("@/lib/orchestration/events");
    const { id } = await createApproval({
      businessId: "b1",
      agentId: "a1",
      artifactRef: { kind: "pr", ref: "123" },
    });
    expect(id).toMatch(/^appr-/);
    expect(store.events.some((e) => e.type === "approval.created")).toBe(true);
    expect(vi.mocked(logEvent)).toHaveBeenCalled();
    expect(logAgentLifecycleStatus).toHaveBeenCalledWith(
      "b1",
      "a1",
      "awaiting_approval",
      expect.objectContaining({ approvalId: id }),
    );
  });

  it("approveArtifact sets status, decidedAt, and logs idle", async () => {
    await createApproval({
      businessId: "b1",
      agentId: "a1",
      artifactRef: {},
    });
    const aid = store.approvals[0]!.id;

    await approveArtifact(aid, "lgtm");

    const row = store.approvals[0]!;
    expect(row.approvalStatus).toBe("approved");
    expect(row.comment).toBe("lgtm");
    expect(row.decidedAt).toBeInstanceOf(Date);
    expect(store.events.some((e) => e.type === "approval.approved")).toBe(true);
    expect(logAgentLifecycleStatus).toHaveBeenCalledWith(
      "b1",
      "a1",
      "idle",
      expect.objectContaining({ approvalId: aid }),
    );
  });

  it("rejectArtifact records rejection", async () => {
    await createApproval({
      businessId: "b1",
      agentId: "a1",
      artifactRef: {},
    });
    await rejectArtifact(store.approvals[0]!.id, "nope");

    expect(store.approvals[0]!.approvalStatus).toBe("rejected");
    expect(store.events.some((e) => e.type === "approval.rejected")).toBe(true);
  });
});
