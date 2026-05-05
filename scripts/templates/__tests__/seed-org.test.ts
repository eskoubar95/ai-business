/**
 * Preconditions for `npm run templates:seed-org` (hash + schema checks are shared with the loader).
 * Deeper assertions live in `lib/templates/__tests__/bundle-verify.test.ts`.
 */
import { describe, expect, it } from "vitest";

import { verifyAndParseBundle } from "@/lib/templates/bundle-verify";
import { TemplateSeedError } from "@/lib/templates/template-errors";

describe("templates:seed-org prerequisites", () => {
  it("rejects partially formed bundle with BUNDLE_SCHEMA_INVALID", () => {
    expect(() =>
      verifyAndParseBundle({
        manifest: {},
        shards: {},
      }),
    ).toThrow(TemplateSeedError);
    try {
      verifyAndParseBundle({ manifest: {}, shards: {} });
    } catch (e) {
      expect(e).toBeInstanceOf(TemplateSeedError);
      expect((e as TemplateSeedError).code).toBe("BUNDLE_SCHEMA_INVALID");
    }
  });
});
