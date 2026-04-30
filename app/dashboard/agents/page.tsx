import Link from "next/link";

import { AgentCard } from "@/components/agents/agent-card";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { getMcpCredentialsMeta } from "@/lib/mcp/actions";
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
        getMcpCredentialsMeta(a.id),
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
        <Link
          href={`/dashboard/agents/new?businessId=${encodeURIComponent(businessId)}`}
          data-testid="agents-new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex rounded-md px-4 py-2 text-sm font-medium"
        >
          New agent
        </Link>
      </div>

      <nav aria-label="Business scope" className="text-muted-foreground flex flex-wrap gap-2 text-sm">
        <span className="font-medium text-foreground">Business:</span>
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/agents?businessId=${encodeURIComponent(b.id)}`}
            className={
              b.id === businessId
                ? "text-foreground font-semibold underline"
                : "hover:text-foreground underline-offset-4 hover:underline"
            }
            data-testid={`agents-business-${b.id}`}
          >
            {b.name}
          </Link>
        ))}
      </nav>

      <section data-testid="agents-roster" className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No agents yet.{" "}
            <Link href={`/dashboard/agents/new?businessId=${businessId}`} className="text-primary underline">
              Create one
            </Link>
            .
          </p>
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
