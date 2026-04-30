import { NextResponse } from "next/server";

import { createApproval } from "@/lib/approvals/actions";
import { auth } from "@/lib/auth/server";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";

/**
 * Seeds a pending approval for Playwright (`tests/approvals.spec.ts`).
 * Disabled in production; requires `E2E_SETUP_SECRET` header match and a signed-in user.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const expected = process.env.E2E_SETUP_SECRET?.trim();
  if (!expected || req.headers.get("x-e2e-secret") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const businessId = (body as { businessId?: unknown }).businessId;
  const agentIdRaw = (body as { agentId?: unknown }).agentId;

  if (typeof businessId !== "string" || !businessId.trim()) {
    return NextResponse.json({ error: "businessId required" }, { status: 400 });
  }

  const agentId =
    typeof agentIdRaw === "string" && agentIdRaw.trim() ? agentIdRaw.trim() : null;

  await assertUserBusinessAccess(userId, businessId.trim());

  const { id } = await createApproval({
    businessId: businessId.trim(),
    agentId,
    artifactRef: {
      title: "E2E pending artifact",
      source: "playwright",
    },
  });

  return NextResponse.json({ id });
}
