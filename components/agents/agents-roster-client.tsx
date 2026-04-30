"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import type { ReactNode } from "react";
import type { AgentCardAgent } from "@/components/agents/agent-card";
import { AgentCard } from "@/components/agents/agent-card";
import { PageEmptyState } from "@/components/page-empty-state";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { Button } from "@/components/ui/button";
import type { AgentLifecycleStatus } from "@/lib/orchestration/events";

export type RosterRow = {
  agent: AgentCardAgent;
  skillCount: number;
  mcpCount: number;
  lifecycle: AgentLifecycleStatus;
};

export function AgentsRosterClient({
  businessId,
  rows,
  emptyCta,
}: {
  businessId: string;
  rows: RosterRow[];
  emptyCta: ReactNode;
}) {
  const [view, setView] = useState<"cards" | "list">("cards");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.agent.name.toLowerCase().includes(s) || r.agent.role.toLowerCase().includes(s),
    );
  }, [rows, q]);

  if (rows.length === 0) {
    return (
      <PageEmptyState
        title="No agents in this business yet"
        description="Agents are the roster entries Cursor and webhooks orchestrate: each has a role, instructions, skills, and MCP tools."
      >
        {emptyCta}
      </PageEmptyState>
    );
  }

  const active = rows.filter((r) => r.lifecycle === "working");

  return (
    <div className="flex flex-col gap-8" data-testid="agents-roster">
      {active.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Active now
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {active.map(({ agent: a, skillCount, mcpCount }) => (
              <div
                key={a.id}
                className="border-border bg-card w-64 shrink-0 animate-in fade-in rounded-lg border p-4 shadow-sm duration-200"
              >
                <Link
                  href={`/dashboard/agents/${a.id}?businessId=${encodeURIComponent(businessId)}`}
                  className="text-foreground block font-medium hover:underline"
                >
                  {a.name}
                </Link>
                <p className="text-muted-foreground line-clamp-2 text-sm">{a.role}</p>
                <div className="text-muted-foreground mt-2 flex gap-3 text-xs">
                  <span>{skillCount} skills</span>
                  <span>{mcpCount} MCP</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-border bg-background relative flex min-w-[200px] max-w-md flex-1 items-center rounded-md border">
          <Search className="text-muted-foreground absolute left-2 size-4" aria-hidden />
          <input
            type="search"
            placeholder="Search agents…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="placeholder:text-muted-foreground w-full cursor-text rounded-md py-2 pr-3 pl-8 text-sm outline-none"
          />
        </div>
        <div className="bg-muted text-muted-foreground inline-flex rounded-md p-1">
          <Button
            type="button"
            variant={view === "cards" ? "secondary" : "ghost"}
            size="sm"
            className="cursor-pointer"
            onClick={() => setView("cards")}
            aria-pressed={view === "cards"}
          >
            <LayoutGrid className="size-4" />
            Cards
          </Button>
          <Button
            type="button"
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="cursor-pointer"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <List className="size-4" />
            List
          </Button>
        </div>
      </div>

      {view === "cards" ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map(({ agent: a, skillCount, mcpCount }) => (
            <AgentCard
              key={a.id}
              agent={a}
              businessId={businessId}
              skillCount={skillCount}
              mcpCount={mcpCount}
            />
          ))}
        </ul>
      ) : (
        <ul className="border-border divide-border divide-y rounded-lg border">
          {filtered.map(({ agent: a, skillCount, mcpCount }) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/agents/${a.id}?businessId=${encodeURIComponent(businessId)}`}
                data-testid={`agent-card-${a.id}`}
                className="hover:bg-accent/50 flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-foreground font-medium">{a.name}</div>
                  <div className="text-muted-foreground truncate text-sm">{a.role}</div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <Suspense
                    fallback={
                      <span className="bg-muted rounded-full px-2 py-0.5">…</span>
                    }
                  >
                    <AgentStatusBadge agentId={a.id} />
                  </Suspense>
                  <span className="text-muted-foreground">{skillCount} skills</span>
                  <span className="text-muted-foreground">{mcpCount} MCP</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
