import Link from "next/link";

import { NewAgentWizard } from "@/components/agents/new-agent-wizard";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

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
    <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
      <PageHeader
        breadcrumb={
          <nav className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Link
              href={`/dashboard/agents?businessId=${encodeURIComponent(businessId)}`}
              className="hover:text-foreground cursor-pointer"
            >
              Agents
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">New agent</span>
          </nav>
        }
        className="border-0 px-0 pt-0"
      />

      <div className="mt-8">
        <NewAgentWizard businessId={businessId} peerAgents={peers} />
      </div>
    </PageWrapper>
  );
}
