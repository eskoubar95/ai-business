import { describe, expect, it } from "vitest";

import {
  extractGrillQuickReplies,
  splitAssistantBodyAndQuickReplies,
} from "../extract-quick-replies";

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

describe("splitAssistantBodyAndQuickReplies", () => {
  it("keeps prose and strips trailing A–D block", () => {
    const text = `Intro line.

More body.

A) First
B) Second option
C) Third
D) Last
`;
    const { body, quickReplies } = splitAssistantBodyAndQuickReplies(text);
    expect(body).toContain("Intro line");
    expect(body).not.toMatch(/A\)\sFirst/);
    expect(quickReplies).toHaveLength(4);
    expect(quickReplies[0].value).toBe("A) First");
  });

  it("respects maxChipLabelLength for display labels (full value unchanged)", () => {
    const long = "B".repeat(120);
    const text = `Intro.\n\nA) ${long}\n`;
    const { quickReplies } = splitAssistantBodyAndQuickReplies(text, { maxChipLabelLength: 24 });
    expect(quickReplies).toHaveLength(1);
    expect(quickReplies[0].value).toBe(`A) ${long}`);
    expect(quickReplies[0].label).toMatch(/^A\. B{23}…$/);
  });

  it("does not strip options from the middle of the message", () => {
    const text = `A) looks like option but mid-text

Then end.
`;
    const { body, quickReplies } = splitAssistantBodyAndQuickReplies(text);
    expect(body).toContain("A) looks like option");
    expect(quickReplies).toHaveLength(0);
  });
});
