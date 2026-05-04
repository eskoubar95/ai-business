import { describe, expect, it } from "vitest";

import {
  countNumberedSoulHeadings,
  isUnsafeSoulRefineOutput,
  wantsGuidanceOnlySoulTurn,
} from "@/lib/grill-me/soul-refine-safety";
import { formatGrillTranscriptForSoulRefine } from "@/lib/grill-me/grill-transcript-for-refine";

describe("isUnsafeSoulRefineOutput", () => {
  const full = ["# X", "## 1. A", "a", "## 2. B", "b", "## 3. C", "c"].join("\n");

  it("flags empty next", () => {
    expect(isUnsafeSoulRefineOutput(full, "")).toBe(true);
  });

  it("flags drastic shrink", () => {
    expect(isUnsafeSoulRefineOutput(full, "næsten intet")).toBe(true);
  });

  it("allows reasonable edit", () => {
    const edited = full.replace("a", "a\n\nmore");
    expect(isUnsafeSoulRefineOutput(full, edited)).toBe(false);
  });
});

describe("countNumberedSoulHeadings", () => {
  it("counts ## and ### numbered headings", () => {
    expect(countNumberedSoulHeadings("## 1. A\n### 2. B\n")).toBe(2);
  });
});

describe("wantsGuidanceOnlySoulTurn", () => {
  it("detects hypothesis validation phrasing", () => {
    expect(wantsGuidanceOnlySoulTurn("Kan vi gå igennem hypoteserne?")).toBe(true);
  });

  it("off when explicit document update", () => {
    expect(
      wantsGuidanceOnlySoulTurn("Opdater dokumentet med mine svar herunder"),
    ).toBe(false);
  });
});

describe("formatGrillTranscriptForSoulRefine", () => {
  it("formats turns compactly", () => {
    const s = formatGrillTranscriptForSoulRefine(
      [
        { id: "1", role: "user", content: "Hej" },
        { id: "2", role: "assistant", content: "[[GRILL_ME_COMPLETE]] Velkommen" },
      ],
      5000,
    );
    expect(s).toContain("Founder");
    expect(s).toContain("Grill-Me");
    expect(s).not.toContain("[[GRILL_ME_COMPLETE]]");
  });
});
