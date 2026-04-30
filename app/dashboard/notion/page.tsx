import Link from "next/link";

import { NotionConnectionPanel } from "@/components/notion/notion-connection-panel";
import { NotionSyncTable } from "@/components/notion/notion-sync-table";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { getMcpCredentialsForAgent } from "@/lib/mcp/actions";
import { listRecentNotionSyncEventsForBusiness } from "@/lib/orchestration/notion-sync-queries";

export const dynamic = "force-dynamic";

export default async function NotionDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/notion");
  const businesses = await loadUserBusinesses();
  const agents = await getAgentsByBusiness(businessId);

  const agentOptions = await Promise.all(
    agents.map(async (a) => {
      const meta = await getMcpCredentialsForAgent(a.id);
      return {
        id: a.id,
        name: a.name,
        hasNotion: meta.some((m) => m.mcpName === "notion"),
      };
    }),
  );

  const syncEvents = await listRecentNotionSyncEventsForBusiness(businessId);
  const lastSync =
    syncEvents[0]?.syncedAt ??
    (syncEvents[0] ? syncEvents[0].createdAt.toISOString() : null);

  return (
    <div className="bg-background text-foreground flex flex-col gap-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notion</h1>
          <p className="text-muted-foreground text-sm">
            Connect Notion MCP credentials per agent and inspect recent task syncs.
          </p>
          {lastSync ? (
            <p className="text-muted-foreground mt-1 text-xs" data-testid="notion-last-sync">
              Last sync recorded: {lastSync}
            </p>
          ) : null}
        </div>
      </div>

      <nav aria-label="Business scope" className="text-muted-foreground flex flex-wrap gap-2 text-sm">
        <span className="font-medium text-foreground">Business:</span>
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/notion?businessId=${encodeURIComponent(b.id)}`}
            className={
              b.id === businessId
                ? "text-foreground font-semibold underline"
                : "hover:text-foreground underline-offset-4 hover:underline"
            }
          >
            {b.name}
          </Link>
        ))}
      </nav>

      <NotionConnectionPanel businessId={businessId} agents={agentOptions} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Recent synced tasks</h2>
        <NotionSyncTable events={syncEvents} />
      </section>
    </div>
  );
}
