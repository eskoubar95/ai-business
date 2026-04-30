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
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <Link
        href={`/dashboard/teams?businessId=${encodeURIComponent(businessId)}`}
        className="text-muted-foreground hover:text-foreground w-fit text-sm underline"
      >
        ← Teams
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New team</h1>
      <TeamCreateForm businessId={businessId} agents={agents} />
    </div>
  );
}
