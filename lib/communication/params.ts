import { z } from "zod";
import { NextResponse } from "next/server";

const UuidParam = z.string().uuid();

/** Validates route dynamic `edgeId`; returns 400 or the uuid string. */
export function parseEdgeIdParam(
  edgeId: string,
): { ok: true; edgeId: string } | { ok: false; response: NextResponse } {
  const parsed = UuidParam.safeParse(edgeId);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json({ error: "edgeId must be a valid UUID" }, { status: 400 }),
    };
  }
  return { ok: true, edgeId: parsed.data };
}
