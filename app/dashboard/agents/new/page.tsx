import Link from "next/link";

import { getAgentsByBusiness } from "@/lib/agents/actions";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

import { AgentForm } from "@/components/agents/agent-form";

export const dynamic = "force-dynamic";

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/agents");
  const peers = await getAgentsByBusiness(businessId);

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/dashboard/agents?businessId=${encodeURIComponent(businessId)}`}
          className="text-muted-foreground hover:text-foreground text-sm underline"
        >
          ← Agents
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New agent</h1>
      <AgentForm mode="create" businessId={businessId} peerAgents={peers} />
    </div>
  );
}
