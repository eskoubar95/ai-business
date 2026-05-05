import { getDb } from "@/db/index";
import { CreateCommunicationEdgeSchema } from "@/lib/communication/schemas";
import { listCommunicationEdges, upsertCommunicationEdge } from "@/lib/communication/edge-store";
import { handleAuthError, requireUserBusiness } from "@/lib/communication/route-auth";

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  try {
    const bid = await requireUserBusiness(businessId);
    const db = getDb();
    const rows = await listCommunicationEdges(db, bid);
    return NextResponse.json({ edges: rows });
  } catch (e) {
    const hit = handleAuthError(e);
    if (hit) return hit;
    throw e;
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const businessIdRaw = (body as { businessId?: unknown }).businessId;
  if (typeof businessIdRaw !== "string" || !businessIdRaw.trim()) {
    return NextResponse.json({ error: "businessId required" }, { status: 400 });
  }

  const rest = { ...body } as Record<string, unknown>;
  delete rest.businessId;

  const parsed = CreateCommunicationEdgeSchema.safeParse({
    fromRole: rest.fromRole,
    toRole: rest.toRole,
    direction: rest.direction,
    allowedIntents: rest.allowedIntents,
    allowedArtifacts: rest.allowedArtifacts,
    requiresHumanAck: rest.requiresHumanAck,
    quotaPerHour: rest.quotaPerHour,
    quotaMode: rest.quotaMode,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    await requireUserBusiness(businessIdRaw);
    const db = getDb();
    const row = await upsertCommunicationEdge(db, businessIdRaw.trim(), parsed.data, {
      templateId: null,
      templateVersion: null,
      derivedFromTemplateId: null,
      derivedFromTemplateVersion: null,
    });
    return NextResponse.json({ edge: row }, { status: 201 });
  } catch (e) {
    const hit = handleAuthError(e);
    if (hit) return hit;
    throw e;
  }
}
