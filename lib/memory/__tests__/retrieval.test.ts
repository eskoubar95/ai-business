import { beforeEach, describe, expect, it, vi } from "vitest";

import { retrieveMemory } from "../retrieval.js";

const limitMock = vi.fn();

vi.mock("@/db/index", () => ({
  getDb: () => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: limitMock,
          })),
        })),
      })),
    })),
  }),
}));

describe("retrieveMemory", () => {
  beforeEach(() => {
    limitMock.mockReset();
    limitMock.mockResolvedValue([
      { content: "latest" },
      { content: "older" },
    ]);
  });

  it("prefers most recently updated rows first in the joined markdown", async () => {
    const businessId = "00000000-0000-0000-0000-0000000000aa";
    const md = await retrieveMemory(businessId, null, 5);

    expect(limitMock).toHaveBeenCalledWith(5);
    expect(md).toBe("latest\n\nolder");
  });
});
