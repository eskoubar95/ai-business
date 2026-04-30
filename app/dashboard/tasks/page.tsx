import Link from "next/link";

import { BusinessSelector } from "@/components/business-selector";
import { Button } from "@/components/ui/button";
import { TaskStatusBoard } from "@/components/tasks/task-status-board";
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
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Orchestration tasks for the selected business. New tasks start in Backlog.
          </p>
        </div>
        <Button asChild data-testid="tasks-new-link">
          <Link href={`/dashboard/tasks/new?businessId=${encodeURIComponent(businessId)}`}>
            New task
          </Link>
        </Button>
      </div>

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      <TaskStatusBoard
        grouped={grouped}
        agentNames={agentNames}
        teamNames={teamNames}
        businessId={businessId}
      />
    </div>
  );
}
