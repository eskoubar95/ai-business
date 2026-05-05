import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { CreateCommunicationEdgeSchema } from "@/lib/communication/schemas";
import { listCommunicationEdges, upsertCommunicationEdge } from "@/lib/communication/edge-store";

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
