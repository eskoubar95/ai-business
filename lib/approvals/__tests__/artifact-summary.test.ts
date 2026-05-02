import { describe, expect, it } from "vitest";

import { summarizeArtifactRef } from "@/lib/approvals/artifact-summary";

describe("summarizeArtifactRef", () => {
  it("uses title when present", () => {
    expect(summarizeArtifactRef({ title: " Hello ", foo: 1 })).toBe("Hello");
  });

  it("falls back to key list", () => {
    expect(summarizeArtifactRef({ a: 1, b: 2 })).toBe("a, b");
  });

  it("handles empty object", () => {
    expect(summarizeArtifactRef({})).toBe("(no reference)");
  });
});
