import { describe, expect, it, vi } from "vitest";
import { checkQuotaAtDispatch, isQuotaExceeded, mergeQuotaWarning } from "../quota-checker";

describe("mergeQuotaWarning", () => {
  it("appends warnings into metadata.quotaWarnings", () => {
    const m1 = mergeQuotaWarning(undefined, "first");
    expect(m1.quotaWarnings).toEqual(["first"]);
    const m2 = mergeQuotaWarning(m1, "second");
    expect(m2.quotaWarnings).toEqual(["first", "second"]);
  });
});

describe("isQuotaExceeded", () => {
  it("is false when limit is null", () => {
    expect(isQuotaExceeded(100, null)).toBe(false);
    expect(isQuotaExceeded(100, undefined)).toBe(false);
  });

  it("is true at boundary", () => {
    expect(isQuotaExceeded(1, 1)).toBe(true);
    expect(isQuotaExceeded(0, 1)).toBe(false);
  });
});

describe("checkQuotaAtDispatch warn_only semantics", () => {
  it("returns empty when no communication edge (smoke)", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    const r = await checkQuotaAtDispatch(
      { fromRole: "a", toRole: "b", businessId: "00000000-0000-0000-0000-000000000001" },
      { db: mockDb as never, log: { warn: vi.fn() } },
    );
    expect(r.warning).toBeUndefined();
  });
});
