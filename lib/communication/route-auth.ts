import { auth } from "@/lib/auth/server";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";

import { NextResponse } from "next/server";

export async function requireUserBusiness(businessId: string | null): Promise<string> {
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

export function handleAuthError(e: unknown): NextResponse | null {
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
