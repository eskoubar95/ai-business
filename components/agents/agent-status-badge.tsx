import { getAgentStatus } from "@/lib/orchestration/events";

function badgeClass(status: string) {
  switch (status) {
    case "idle":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "working":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-400";
    case "awaiting_approval":
      return "bg-red-500/15 text-red-700 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export async function AgentStatusBadge({ agentId }: { agentId: string }) {
  const status = await getAgentStatus(agentId);
  const label = status.replaceAll("_", " ");
  return (
    <span
      data-testid={`agent-status-${agentId}`}
      className={`rounded-full px-2 py-0.5 text-xs uppercase ${badgeClass(status)}`}
    >
      {label}
    </span>
  );
}
