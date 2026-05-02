import { describe, expect, it } from "vitest";

import { extractGrillQuickReplies } from "../extract-quick-replies";

describe("extractGrillQuickReplies", () => {
  it("parses A–D style lines", () => {
    const md = `
Some intro text.

A) First path
B) Second path  
C) Third
D) Something else — freeform

Thanks.
`;
    const r = extractGrillQuickReplies(md);
    expect(r).toHaveLength(4);
    expect(r[0]).toMatchObject({ id: "A", value: "A) First path" });
    expect(r[3].value).toContain("Something else");
  });

  it("returns empty when no options", () => {
    expect(extractGrillQuickReplies("Just prose without markers.")).toEqual([]);
  });
});
