import { randomUUID } from "node:crypto";

import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { ConsultCheckBodySchema } from "@/lib/communication/schemas";
import { checkConsult } from "@/lib/communication/policy-enforcer";
import { jsonPolicyViolation } from "@/lib/communication/http";
import { isOrchestratorAuthorized } from "@/lib/communication/orchestrator-auth";

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ConsultCheckBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  const orchestratorSecret = process.env.COMMUNICATION_ORCHESTRATOR_SECRET?.trim();
  const asOrchestrator = isOrchestratorAuthorized(req, orchestratorSecret);

  if (!asOrchestrator) {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await assertUserBusinessAccess(userId, parsed.data.org_id);
    } catch (err) {
      if (err instanceof Error && err.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      throw err;
    }
  }

  let result: Awaited<ReturnType<typeof checkConsult>>;
  try {
    const db = getDb();
    result = await checkConsult(db, parsed.data);
  } catch (err) {
    const correlationId = randomUUID();
    console.error("checkConsult failed", { correlationId, err });
    return NextResponse.json(
      { error: "Internal server error", correlation_id: correlationId },
      { status: 500 },
    );
  }

  if (!result.allowed) {
    return jsonPolicyViolation(result.error);
  }

  return NextResponse.json({
    allowed: true,
    correlation_id: result.correlation_id,
  });
}
