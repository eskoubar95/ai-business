import { cn } from "@/lib/utils";
import type { AgentLifecycleStatus } from "@/lib/orchestration/events";

function dotClass(status: string) {
  switch (status) {
    case "working":
      return "bg-status-active animate-pulse";
    case "awaiting_approval":
      return "bg-warning";
    case "idle":
    default:
      return "bg-status-idle";
  }
}

function labelClass(status: string) {
  switch (status) {
    case "working":
      return "text-status-active";
    case "awaiting_approval":
      return "text-warning";
    default:
      return "text-muted-foreground";
  }
}

/** Client- and server-safe: status must be loaded by the parent (e.g. RSC or props). */
export function AgentStatusBadge({
  agentId,
  status,
}: {
  agentId: string;
  status: AgentLifecycleStatus;
}) {
  const label = status === "awaiting_approval" ? "Awaiting approval" : status;
  return (
    <span
      data-testid={`agent-status-${agentId}`}
      className="flex items-center gap-1.5"
    >
      <span className={cn("size-1.5 rounded-full", dotClass(status))} />
      <span className={cn("text-[11px] font-medium uppercase tracking-wide", labelClass(status))}>
        {label}
      </span>
    </span>
  );
}
