import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import { businesses, userBusinesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function loadUserBusinesses(): Promise<{ id: string; name: string }[]> {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    redirect("/auth/sign-in");
  }

  const db = getDb();
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
    })
    .from(userBusinesses)
    .innerJoin(businesses, eq(userBusinesses.businessId, businesses.id))
    .where(eq(userBusinesses.userId, userId));

  return rows;
}

/** Dashboard routes that scope state with `?businessId=`. */
export type DashboardScopedPath =
  | "/dashboard/agents"
  | "/dashboard/teams"
  | "/dashboard/tasks"
  | "/dashboard/skills"
  | "/dashboard/approvals"
  | "/dashboard/notion"
  | "/dashboard/webhooks";

/** Ensures `businessId` belongs to the session user; otherwise redirects with first business or onboarding. */
export async function resolveBusinessIdParam(
  businessIdParam: string | undefined,
  redirectBasePath: DashboardScopedPath,
): Promise<string> {
  const rows = await loadUserBusinesses();
  if (rows.length === 0) {
    redirect("/dashboard/onboarding");
  }

  const valid =
    typeof businessIdParam === "string" &&
    businessIdParam.length > 0 &&
    rows.some((r) => r.id === businessIdParam);

  if (valid) {
    return businessIdParam!;
  }

  redirect(`${redirectBasePath}?businessId=${rows[0]!.id}`);
}
