import { beforeEach, describe, expect, it, vi } from "vitest";

import { GRILL_ME_COMPLETE_MARKER } from "@/lib/grill-me/markers";

const businessId = "00000000-0000-4000-8000-000000000042";

const store = vi.hoisted(() => ({
  grillRows: [] as Array<{
    businessId: string;
    role: string;
    content: string;
    seq: number;
  }>,
  memoryInserts: [] as Array<Record<string, unknown>>,
  selectPass: 0,
}));

vi.mock("@/lib/auth/server", () => ({
  auth: {
    getSession: vi.fn(async () => ({
      data: { user: { id: "test-user-id" } },
    })),
  },
}));

vi.mock("@/lib/cursor/agent", () => ({
  runCursorAgent: vi.fn(async () => {
    async function* gen() {
      yield `${GRILL_ME_COMPLETE_MARKER}\n\n# Soul\nHello world`;
    }
    return gen();
  }),
}));

vi.mock("@/db/index", () => ({
  getDb() {
    return {
      query: {
        userBusinesses: {
          findFirst: vi.fn(async () => ({
            userId: "test-user-id",
            businessId,
          })),
        },
        memory: {
          findFirst: vi.fn(async () => undefined),
        },
      },
      insert() {
        return {
          values: (vals: Record<string, unknown>) => {
            if ("seq" in vals && "role" in vals) {
              store.grillRows.push({
                businessId: vals.businessId as string,
                role: vals.role as string,
                content: vals.content as string,
                seq: vals.seq as number,
              });
            }
            if (vals.scope === "business") {
              store.memoryInserts.push(vals);
            }
            return Promise.resolve(undefined);
          },
        };
      },
      select(fields?: Record<string, unknown>) {
        void fields;
        store.selectPass++;
        if (store.selectPass === 1) {
          return {
            from: () => ({
              where: () => Promise.resolve([{ nextSeq: 0 }]),
            }),
          };
        }
        return {
          from: () => ({
            where: () => ({
              orderBy: () =>
                Promise.resolve(
                  [...store.grillRows]
                    .filter((r) => r.businessId === businessId)
                    .sort((a, b) => b.seq - a.seq)
                    .map((r) => ({
                      businessId: r.businessId,
                      role: r.role,
                      content: r.content,
                      seq: r.seq,
                    })),
                ),
            }),
          }),
        };
      },
    };
  },
}));

describe("startGrillMeTurn", () => {
  beforeEach(() => {
    store.grillRows = [];
    store.memoryInserts = [];
    store.selectPass = 0;
    vi.clearAllMocks();
  });

  it("persists user turn with role user and stores soul memory when marker present", async () => {
    const { startGrillMeTurn } = await import("../actions.js");
    const { runCursorAgent } = await import("@/lib/cursor/agent");

    const userMessage = "Describe my product";
    const result = await startGrillMeTurn(businessId, userMessage);

    expect(runCursorAgent).toHaveBeenCalled();

    const userRow = store.grillRows.find((r) => r.role === "user");
    expect(userRow).toBeDefined();
    expect(userRow?.businessId).toBe(businessId);
    expect(userRow?.content).toBe(userMessage);

    const assistantRow = store.grillRows.find((r) => r.role === "assistant");
    expect(assistantRow).toBeDefined();
    expect(result.soulStored).toBe(true);
    expect(result.assistantReply).toContain(GRILL_ME_COMPLETE_MARKER);

    expect(store.memoryInserts.length).toBe(1);
    const mem = store.memoryInserts[0];
    expect(mem.scope).toBe("business");
    expect(mem.businessId).toBe(businessId);
    expect(mem.agentId ?? null).toBeNull();
    expect(typeof mem.content).toBe("string");
    expect((mem.content as string).includes("# Soul")).toBe(true);
    expect((mem.content as string).includes(GRILL_ME_COMPLETE_MARKER)).toBe(false);
  });
});
