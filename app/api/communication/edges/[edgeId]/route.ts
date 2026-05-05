import { getDb } from "@/db/index";
import { UpdateCommunicationEdgeSchema } from "@/lib/communication/schemas";
import {
  deleteCommunicationEdge,
  getCommunicationEdgeById,
  mergeSmartUpdateEdge,
} from "@/lib/communication/edge-store";
import { parseEdgeIdParam } from "@/lib/communication/params";
import { handleAuthError, requireUserBusiness } from "@/lib/communication/route-auth";
import { getError } from "@/lib/templates/error-registry";
import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function edgeNotFound(correlationId: string) {
  const e = getError("EDGE_NOT_FOUND");
  return NextResponse.json(
    {
      error_code: e.code,
      correlation_id: correlationId,
      remediation_key: e.remediation_key,
      detail: e.message,
    },
    { status: e.http_status },
  );
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ edgeId: string }> },
) {
  const { edgeId: rawEdgeId } = await context.params;
  const idCheck = parseEdgeIdParam(rawEdgeId);
  if (!idCheck.ok) {
    return idCheck.response;
  }
  const edgeId = idCheck.edgeId;
  const businessId = req.nextUrl.searchParams.get("businessId");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = UpdateCommunicationEdgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const bid = await requireUserBusiness(businessId);
    const db = getDb();
    const existing = await getCommunicationEdgeById(db, bid, edgeId);
    if (!existing) {
      return edgeNotFound(randomUUID());
    }
    const row = await mergeSmartUpdateEdge(db, bid, edgeId, parsed.data);
    if (!row) {
      return edgeNotFound(randomUUID());
    }
    return NextResponse.json({ edge: row });
  } catch (e) {
    const hit = handleAuthError(e);
    if (hit) return hit;
    throw e;
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ edgeId: string }> },
) {
  const { edgeId: rawEdgeId } = await context.params;
  const idCheck = parseEdgeIdParam(rawEdgeId);
  if (!idCheck.ok) {
    return idCheck.response;
  }
  const edgeId = idCheck.edgeId;
  const businessId = req.nextUrl.searchParams.get("businessId");

  try {
    const bid = await requireUserBusiness(businessId);
    const db = getDb();
    const ok = await deleteCommunicationEdge(db, bid, edgeId);
    if (!ok) {
      return edgeNotFound(randomUUID());
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const hit = handleAuthError(e);
    if (hit) return hit;
    throw e;
  }
}
