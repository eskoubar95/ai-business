import { redirect } from "next/navigation";

import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

export const dynamic = "force-dynamic";

/** @deprecated Use `/dashboard/settings?section=notion` (merged settings shell). */
export default async function NotionDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/notion");
  redirect(`/dashboard/settings?businessId=${encodeURIComponent(businessId)}&section=notion`);
}
