import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import { describe, expect, it, vi } from "vitest";

const insertValuesSpy = vi.fn(() => ({ returning: vi.fn(async () => []) }));

vi.mock("@/db/index", () => ({
  getDb(): Pick<NeonHttpDatabase<object>, "insert" | "query"> {
    return {
      insert: () => ({
        values: (...args: unknown[]) => insertValuesSpy(...args),
      }),
      query: {
        memory: {
          findFirst: vi.fn(async (): Promise<object | undefined> => undefined),
        },
      },
    };
  },
}));

describe("extractAndStoreSoulFile", () => {
  it("inserts business-scope markdown when absent", async () => {
    insertValuesSpy.mockClear();

    const { extractAndStoreSoulFile } =
      await import("../soul-memory.js");

    await extractAndStoreSoulFile(
      "00000000-0000-0000-0000-000000000099",
      "[[GRILL_ME_COMPLETE]]\n\n# Soul\nDone",
    );

    expect(insertValuesSpy).toHaveBeenCalled();
    const firstArg = insertValuesSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(firstArg.scope).toBe("business");
    expect(firstArg.agentId).toBeNull();
    expect(firstArg.businessId).toBe("00000000-0000-0000-0000-000000000099");
    expect(typeof firstArg.content).toBe("string");
  });
});
