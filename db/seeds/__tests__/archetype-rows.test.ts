import { describe, expect, it } from "vitest";

import { LAUNCH_ARCHETYPE_ROWS } from "@/db/seeds/archetype-rows";

describe("LAUNCH_ARCHETYPE_ROWS", () => {
  it("defines two unique slugs with non-empty addenda", () => {
    expect(LAUNCH_ARCHETYPE_ROWS).toHaveLength(2);
    const slugs = LAUNCH_ARCHETYPE_ROWS.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(2);
    for (const row of LAUNCH_ARCHETYPE_ROWS) {
      expect(row.name.length).toBeGreaterThan(0);
      expect(row.description.length).toBeGreaterThan(0);
      expect(row.soulAddendum.trim().length).toBeGreaterThan(20);
      expect(row.toolsAddendum.trim().length).toBeGreaterThan(20);
      expect(row.heartbeatAddendum.trim().length).toBeGreaterThan(20);
    }
  });
});
