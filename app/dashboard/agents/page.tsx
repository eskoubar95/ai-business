import Link from "next/link";

import { AgentsDashboardAutoRefresh } from "@/components/agents/agents-dashboard-auto-refresh";
import { AgentsRosterClient } from "@/components/agents/agents-roster-client";
import { BusinessSelector } from "@/components/business-selector";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { getMcpCredentialsForAgent } from "@/lib/mcp/actions";
import { getAgentStatus } from "@/lib/orchestration/events";
import { getSkillsByAgent } from "@/lib/skills/actions";

export const dynamic = "force-dynamic";

export default async function AgentsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/agents");
  const businesses = await loadUserBusinesses();
  const agents = await getAgentsByBusiness(businessId);

  const rows = await Promise.all(
    agents.map(async (a) => {
      const [skills, mcps, lifecycle] = await Promise.all([
        getSkillsByAgent(a.id),
        getMcpCredentialsForAgent(a.id),
        getAgentStatus(a.id),
      ]);
      return {
        agent: { id: a.id, name: a.name, role: a.role },
        skillCount: skills.length,
        mcpCount: mcps.length,
        lifecycle,
      };
    }),
  );

  return (
    <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
      <AgentsDashboardAutoRefresh />
      <PageHeader
        breadcrumb={
          <div>
            <h1 className="text-foreground text-lg font-semibold">Agents</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Roster, skills, and MCP per business.
            </p>
          </div>
        }
        actions={
          <Button asChild className="cursor-pointer" data-testid="agents-new">
            <Link href={`/dashboard/agents/new?businessId=${encodeURIComponent(businessId)}`}>
              New agent
            </Link>
          </Button>
        }
        className="border-0 px-0 pt-0"
      />

      <div className="mt-6">
        <BusinessSelector businesses={businesses} currentBusinessId={businessId} />
      </div>

      <div className="mt-8">
        <AgentsRosterClient
          businessId={businessId}
          rows={rows}
          emptyCta={
            <Button asChild data-testid="agents-empty-cta">
              <Link href={`/dashboard/agents/new?businessId=${encodeURIComponent(businessId)}`}>
                Create agent
              </Link>
            </Button>
          }
        />
      </div>
    </PageWrapper>
  );
}
