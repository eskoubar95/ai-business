import registryJson from "@/templates/conduro/enterprise/v3/errors/registry.json";
import { describe, expect, it } from "vitest";

import { type ErrorCode, getError } from "@/lib/templates/error-registry";

describe("error-registry", () => {
  it("returns every configured code", () => {
    for (const row of registryJson.error_codes) {
      expect(getError(row.code as ErrorCode).code).toBe(row.code);
    }
  });

  it("throws on unknown code", () => {
    expect(() => getError("NOT_A_REAL_CODE" as ErrorCode)).toThrow(/Unknown error code/);
  });
});
