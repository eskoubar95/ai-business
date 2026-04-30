import Link from "next/link";
import { Suspense } from "react";

import { AgentStatusBadge } from "@/components/agents/agent-status-badge";

export type AgentCardAgent = {
  id: string;
  name: string;
  role: string;
};

export function AgentCard(props: {
  agent: AgentCardAgent;
  businessId: string;
  skillCount: number;
  mcpCount: number;
}) {
  const { agent: a, businessId, skillCount, mcpCount } = props;

  return (
    <li>
      <Link
        href={`/dashboard/agents/${a.id}?businessId=${encodeURIComponent(businessId)}`}
        data-testid={`agent-card-${a.id}`}
        className="border-border hover:bg-muted/40 flex flex-col gap-2 rounded-lg border p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{a.name}</span>
          <Suspense
            fallback={
              <span
                data-testid={`agent-status-${a.id}`}
                className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs uppercase"
              >
                …
              </span>
            }
          >
            <AgentStatusBadge agentId={a.id} />
          </Suspense>
        </div>
        <p className="text-muted-foreground text-sm">{a.role}</p>
        <div className="text-muted-foreground flex gap-3 text-xs">
          <span data-testid={`agent-skills-count-${a.id}`}>{skillCount} skills</span>
          <span data-testid={`agent-mcp-count-${a.id}`}>{mcpCount} MCP</span>
        </div>
      </Link>
    </li>
  );
}
