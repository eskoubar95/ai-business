import Link from "next/link";

import { BusinessSelector } from "@/components/business-selector";
import { AgentCard } from "@/components/agents/agent-card";
import { PageEmptyState } from "@/components/page-empty-state";
import { Button } from "@/components/ui/button";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { getMcpCredentialsForAgent } from "@/lib/mcp/actions";
import { getSkillsByAgent } from "@/lib/skills/actions";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

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
      const [skills, mcps] = await Promise.all([
        getSkillsByAgent(a.id),
        getMcpCredentialsForAgent(a.id),
      ]);
      return { agent: a, skillCount: skills.length, mcpCount: mcps.length };
    }),
  );

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm">
            Manage roster, skills, and MCP installs per business.
          </p>
        </div>
        <Button asChild data-testid="agents-new">
          <Link href={`/dashboard/agents/new?businessId=${encodeURIComponent(businessId)}`}>
            New agent
          </Link>
        </Button>
      </div>

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      <section data-testid="agents-roster" className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <PageEmptyState
            title="No agents in this business yet"
            description="Agents are the roster entries Cursor and webhooks orchestrate: each has a role, instructions, skills, and MCP tools. Create your first agent to start delegating work and running heartbeats."
          >
            <Button asChild data-testid="agents-empty-cta">
              <Link href={`/dashboard/agents/new?businessId=${encodeURIComponent(businessId)}`}>
                Create agent
              </Link>
            </Button>
          </PageEmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {rows.map(({ agent: a, skillCount, mcpCount }) => (
              <AgentCard
                key={a.id}
                agent={{ id: a.id, name: a.name, role: a.role }}
                businessId={businessId}
                skillCount={skillCount}
                mcpCount={mcpCount}
              />
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
