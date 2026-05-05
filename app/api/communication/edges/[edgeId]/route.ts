import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { UpdateCommunicationEdgeSchema } from "@/lib/communication/schemas";
import {
  deleteCommunicationEdge,
  getCommunicationEdgeById,
  mergeSmartUpdateEdge,
} from "@/lib/communication/edge-store";
import { getError } from "@/lib/templates/error-registry";
import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function requireUserBusiness(businessId: string | null): Promise<string> {
  if (!businessId?.trim()) {
    throw new Error("BAD_REQUEST:businessId required");
  }
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    throw new Error("UNAUTHORIZED");
  }
  await assertUserBusinessAccess(userId, businessId.trim());
  return businessId.trim();
}

function handleAuthError(e: unknown): NextResponse | null {
  if (!(e instanceof Error)) return null;
  if (e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (e.message === "Forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (e.message.startsWith("BAD_REQUEST:")) {
    return NextResponse.json(
      { error: e.message.replace(/^BAD_REQUEST:/, "").trim() },
      { status: 400 },
    );
  }
  return null;
}

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
  const { edgeId } = await context.params;
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
  const { edgeId } = await context.params;
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
