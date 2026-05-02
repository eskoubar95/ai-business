import { describe, expect, it } from "vitest";

import { extractFirstJsonObject } from "@/lib/grill-me/extract-json-from-model";

describe("extractFirstJsonObject", () => {
  it("parses raw JSON", () => {
    const o = extractFirstJsonObject(`{"a":1}`);
    expect(o).toEqual({ a: 1 });
  });

  it("strips json fences", () => {
    const o = extractFirstJsonObject("```json\n{\"x\":true}\n```");
    expect(o).toEqual({ x: true });
  });
});
