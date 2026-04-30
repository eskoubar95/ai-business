import Link from "next/link";

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
              <li key={a.id}>
                <Link
                  href={`/dashboard/agents/${a.id}/edit?businessId=${encodeURIComponent(businessId)}`}
                  data-testid={`agent-card-${a.id}`}
                  className="border-border hover:bg-muted/40 flex flex-col gap-2 rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{a.name}</span>
                    <span
                      data-testid={`agent-status-${a.id}`}
                      className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs uppercase"
                    >
                      idle
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{a.role}</p>
                  <div className="text-muted-foreground flex gap-3 text-xs">
                    <span data-testid={`agent-skills-count-${a.id}`}>{skillCount} skills</span>
                    <span data-testid={`agent-mcp-count-${a.id}`}>{mcpCount} MCP</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-muted-foreground text-xs">
        Live agent status (working / awaiting approval) ships with orchestration — cards show a static{" "}
        <strong>idle</strong> badge for now.
      </p>
    </div>
  );
}
