import Link from "next/link";

import { BusinessSelector } from "@/components/business-selector";
import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { getTasksByBusiness } from "@/lib/tasks/actions";
import { flattenTaskTree } from "@/lib/tasks/flatten-task-tree";
import { listTeamsByBusiness } from "@/lib/teams/actions";

export const dynamic = "force-dynamic";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/tasks");
  const businesses = await loadUserBusinesses();

  const [agents, teams, tree] = await Promise.all([
    getAgentsByBusiness(businessId),
    listTeamsByBusiness(businessId),
    getTasksByBusiness(businessId),
  ]);

  const tasksFlat = flattenTaskTree(tree).map((t) => ({
    id: t.id,
    title: t.title,
  }));

  const teamOptions = teams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/dashboard/tasks?businessId=${encodeURIComponent(businessId)}`}
          className="text-muted-foreground hover:text-foreground text-sm underline"
          data-testid="tasks-new-back"
        >
          ← Tasks
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New task</h1>
        <p className="text-muted-foreground text-sm">Create a task for this business.</p>
      </div>

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      <TaskCreateForm
        businessId={businessId}
        agents={agents.map((a) => ({ id: a.id, name: a.name }))}
        teams={teamOptions}
        tasksFlat={tasksFlat}
      />
    </div>
  );
}
