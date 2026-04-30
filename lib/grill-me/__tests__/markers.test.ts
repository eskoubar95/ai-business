import { describe, expect, it } from "vitest";

import {
  GRILL_ME_COMPLETE_MARKER,
  stripCompletionMarkers,
} from "../markers";

describe("Grill-Me markers", () => {
  it("removes completion marker leaving markdown soul body", () => {
    const raw = `${GRILL_ME_COMPLETE_MARKER}\n\n# Soul Markdown\n`;
    expect(stripCompletionMarkers(raw)).toBe("# Soul Markdown");
  });

  it("exports stable sentinel string", () => {
    expect(GRILL_ME_COMPLETE_MARKER).toBe("[[GRILL_ME_COMPLETE]]");
  });
});
