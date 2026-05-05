import { describe, expect, it } from "vitest";
import { pickFairShareJob } from "../job-queue";

function job(biz: string, t: number, id: string) {
  return { id, businessId: biz, enqueuedAt: new Date(t) };
}

describe("pickFairShareJob", () => {
  it("alternates between two businesses when many jobs on one side", () => {
    const queued = [
      job("org-a", 1, "a1"),
      job("org-a", 2, "a2"),
      job("org-a", 3, "a3"),
      job("org-b", 4, "b1"),
    ];

    expect(pickFairShareJob(queued, null)?.id).toBe("a1");
    expect(pickFairShareJob(queued, "org-a")?.id).toBe("b1");
    expect(pickFairShareJob(queued, "org-b")?.id).toBe("a1");
    expect(pickFairShareJob(queued, "org-a")?.id).toBe("b1");
  });

  it("does not starve the other org when one has the oldest timestamp overall", () => {
    const queued = [
      job("org-b", 10, "b-old"),
      job("org-a", 20, "a1"),
      job("org-a", 21, "a2"),
    ];
    expect(pickFairShareJob(queued, null)?.id).toBe("b-old");
    expect(pickFairShareJob(queued, "org-b")?.id).toBe("a1");
  });
});
