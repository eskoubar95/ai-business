import { describe, expect, it } from "vitest";

import {
  GRILL_SOUL_SECTION_HEADINGS,
  buildGrillPrompt,
} from "@/lib/grill-me/grill-prompt.js";

describe("buildGrillPrompt", () => {
  it("lists all required soul headings for both paths", () => {
    const a = buildGrillPrompt([], "Hi", "existing");
    const b = buildGrillPrompt([], "Hi", "new");
    for (const h of GRILL_SOUL_SECTION_HEADINGS) {
      expect(a).toContain(h);
      expect(b).toContain(h);
    }
  });

  it("differs materially between existing business and new project paths", () => {
    const existing = buildGrillPrompt([], "Hi", "existing");
    const nu = buildGrillPrompt([], "Hi", "new");
    expect(existing).toContain("Existing business");
    expect(nu).toContain("New project");
    expect(existing).not.toContain("New project");
    expect(nu).not.toContain("Existing business");
  });
});
