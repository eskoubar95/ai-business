import Link from "next/link";

import { BusinessSelector } from "@/components/business-selector";
import { PageEmptyState } from "@/components/page-empty-state";
import { TasksKanbanBoard } from "@/components/tasks/tasks-kanban-board";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { getTasksByBusiness, type TaskStatus } from "@/lib/tasks/actions";
import { flattenTaskTree } from "@/lib/tasks/flatten-task-tree";
import type { TaskRow } from "@/lib/tasks/task-tree";
import { listTeamsByBusiness } from "@/lib/teams/actions";

export const dynamic = "force-dynamic";

function groupByStatus(rows: TaskRow[]): Record<TaskStatus, TaskRow[]> {
  const empty: Record<TaskStatus, TaskRow[]> = {
    backlog: [],
    in_progress: [],
    blocked: [],
    in_review: [],
    done: [],
  };
  for (const r of rows) {
    empty[r.status].push(r);
  }
  return empty;
}

export default async function TasksDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/tasks");
  const businesses = await loadUserBusinesses();

  const [tree, agents, teams] = await Promise.all([
    getTasksByBusiness(businessId),
    getAgentsByBusiness(businessId),
    listTeamsByBusiness(businessId),
  ]);

  const flat = flattenTaskTree(tree);
  const grouped = groupByStatus(flat);

  const agentNames = Object.fromEntries(agents.map((a) => [a.id, a.name]));
  const teamNames = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  return (
    <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
      <PageHeader
        breadcrumb={
          <div>
            <h1 className="text-foreground text-lg font-semibold">Tasks</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Orchestration tasks for the selected business. New tasks start in Backlog.
            </p>
          </div>
        }
        actions={
          <Button asChild className="cursor-pointer" data-testid="tasks-new-link">
            <Link href={`/dashboard/tasks/new?businessId=${encodeURIComponent(businessId)}`}>
              New task
            </Link>
          </Button>
        }
        className="px-0 pt-0"
      />

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      {flat.length === 0 ? (
        <PageEmptyState
          title="No tasks yet for this business"
          description="Tasks track orchestration work from backlog through done: assign agents or teams, move columns as work progresses, and log updates for the whole team. Start with one task to see the board in action."
          testId="tasks-empty"
        >
          <Button asChild data-testid="tasks-empty-cta">
            <Link href={`/dashboard/tasks/new?businessId=${encodeURIComponent(businessId)}`}>
              Create first task
            </Link>
          </Button>
        </PageEmptyState>
      ) : (
        <div className="mt-6">
          <TasksKanbanBoard
            grouped={grouped}
            agentNames={agentNames}
            teamNames={teamNames}
            businessId={businessId}
          />
        </div>
      )}
    </PageWrapper>
  );
}
