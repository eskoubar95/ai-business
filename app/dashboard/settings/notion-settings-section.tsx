import { NotionConnectionPanel } from "@/components/notion/notion-connection-panel";
import { NotionSyncTable } from "@/components/notion/notion-sync-table";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { getMcpCredentialsForAgent } from "@/lib/mcp/actions";
import { listRecentNotionSyncEventsForBusiness } from "@/lib/orchestration/notion-sync-queries";

export async function NotionSettingsSection({ businessId }: { businessId: string }) {
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
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-medium">Notion</h2>
        <p className="text-muted-foreground text-sm">
          Connect Notion MCP credentials per agent and inspect recent task syncs.
        </p>
        {lastSync ? (
          <p className="text-muted-foreground mt-1 text-xs" data-testid="notion-last-sync">
            Last sync recorded: {lastSync}
          </p>
        ) : null}
      </div>

      <NotionConnectionPanel businessId={businessId} agents={agentOptions} />

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">Recent synced tasks</h3>
        <NotionSyncTable events={syncEvents} />
      </section>
    </div>
  );
}
