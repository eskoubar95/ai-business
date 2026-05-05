import { describe, expect, it } from "vitest";

import { parseEdgeIdParam } from "@/lib/communication/params";

describe("parseEdgeIdParam", () => {
  it("accepts valid UUID", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const r = parseEdgeIdParam(id);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.edgeId).toBe(id);
  });

  it("rejects invalid uuid", () => {
    const r = parseEdgeIdParam("not-a-uuid");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(400);
  });
});
