"use client";

type AgentNode = {
  id: string;
  name: string;
  reportsToAgentId: string | null;
};

function buildChildrenMap(agents: AgentNode[]): Map<string | null, AgentNode[]> {
  const ids = new Set(agents.map((a) => a.id));
  const map = new Map<string | null, AgentNode[]>();
  for (const a of agents) {
    const parent =
      a.reportsToAgentId && ids.has(a.reportsToAgentId) ? a.reportsToAgentId : null;
    const list = map.get(parent) ?? [];
    list.push(a);
    map.set(parent, list);
  }
  for (const [, list] of map) {
    list.sort((x, y) => x.name.localeCompare(y.name));
  }
  return map;
}

function Subtree({
  agentId,
  byParent,
  depth,
  highlightAgentId,
}: {
  agentId: string;
  byParent: Map<string | null, AgentNode[]>;
  depth: number;
  highlightAgentId?: string | null;
}) {
  const kids = byParent.get(agentId) ?? [];
  return (
    <ul className={depth === 0 ? "flex flex-col gap-3" : "mt-2 flex flex-col gap-2 border-l pl-4"}>
      {kids.map((child) => (
        <li key={child.id} data-testid={`org-node-${child.id}`}>
          <div
            className={`inline-block rounded-md px-3 py-1.5 text-sm font-medium ${
              highlightAgentId === child.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60"
            }`}
          >
            {child.name}
          </div>
          <Subtree
            agentId={child.id}
            byParent={byParent}
            depth={depth + 1}
            highlightAgentId={highlightAgentId}
          />
        </li>
      ))}
    </ul>
  );
}

type Props = {
  agents: AgentNode[];
  highlightAgentId?: string | null;
};

export function OrgChart({ agents, highlightAgentId }: Props) {
  const byParent = buildChildrenMap(agents);
  const roots = byParent.get(null) ?? [];

  return (
    <div className="org-chart text-sm" data-testid="org-chart">
      {roots.length === 0 ? (
        <p className="text-muted-foreground">No reporting hierarchy for these agents.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {roots.map((r) => (
            <li key={r.id} data-testid={`org-node-${r.id}`}>
              <div
                className={`inline-block rounded-md px-3 py-1.5 text-sm font-medium ${
                  highlightAgentId === r.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60"
                }`}
              >
                {r.name}
              </div>
              <Subtree
                agentId={r.id}
                byParent={byParent}
                depth={1}
                highlightAgentId={highlightAgentId}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
