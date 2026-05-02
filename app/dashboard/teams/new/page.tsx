import Link from "next/link";

import { getAgentsByBusiness } from "@/lib/agents/actions";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { TeamCreateForm } from "@/components/agents/team-create-form";

export const dynamic = "force-dynamic";

export default async function NewTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/teams");
  const agents = await getAgentsByBusiness(businessId);

  return (
    <div className="flex min-h-full flex-col">
      {/* Page header */}
      <div className="flex h-14 shrink-0 items-center border-b border-white/[0.07] px-6">
        <nav className="flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
          <Link
            href={`/dashboard/teams?businessId=${encodeURIComponent(businessId)}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Teams
          </Link>
          <span className="text-white/20">/</span>
          <span className="font-medium text-foreground">New team</span>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <TeamCreateForm businessId={businessId} agents={agents} />
      </div>
    </div>
  );
}
