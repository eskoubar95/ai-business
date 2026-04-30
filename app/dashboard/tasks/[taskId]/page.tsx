import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BusinessSelector } from "@/components/business-selector";
import { TaskCommentInput } from "@/components/tasks/task-comment-input";
import { TaskLogFeed } from "@/components/tasks/task-log-feed";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { auth } from "@/lib/auth/server";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { getTaskById } from "@/lib/tasks/actions";
import { getTaskLogs } from "@/lib/tasks/log-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  backlog: "Backlog",
  in_progress: "In progress",
  blocked: "Blocked",
  in_review: "In review",
  done: "Done",
} as const;

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ businessId?: string }>;
}) {
  const { taskId } = await params;
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/tasks");
  const businesses = await loadUserBusinesses();

  const task = await getTaskById(taskId);
  if (!task || task.businessId !== businessId) {
    notFound();
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    redirect("/auth/sign-in");
  }

  const [agents, logs] = await Promise.all([
    getAgentsByBusiness(businessId),
    getTaskLogs(taskId),
  ]);

  const agentNames = Object.fromEntries(agents.map((a) => [a.id, a.name]));

  const assignedName = task.agentId ? (agentNames[task.agentId] ?? null) : null;

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/dashboard/tasks?businessId=${encodeURIComponent(businessId)}`}
          className="text-muted-foreground hover:text-foreground text-sm underline"
          data-testid="task-detail-back"
        >
          ← Tasks
        </Link>
      </div>

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      <header className="flex flex-col gap-3 border-b pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {STATUS_LABEL[task.status]}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight" data-testid="task-detail-title">
              {task.title}
            </h1>
          </div>
          <TaskStatusSelect
            key={`${task.id}-${task.status}-${task.updatedAt.toISOString()}`}
            taskId={task.id}
            initialStatus={task.status}
          />
        </div>
        {assignedName ? (
          <p className="text-muted-foreground text-sm">
            Assigned agent: <span className="text-foreground font-medium">{assignedName}</span>
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">No agent assigned.</p>
        )}
        {task.description.trim().length > 0 ? (
          <div className="border-border text-foreground mt-2 max-w-2xl whitespace-pre-wrap border-l-2 pl-4 text-sm">
            {task.description}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm italic">No description.</p>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Activity</h2>
        <TaskLogFeed
          logs={logs.map((l) => ({
            id: l.id,
            authorType: l.authorType,
            authorId: l.authorId,
            content: l.content,
            createdAt: l.createdAt,
          }))}
          agentNames={agentNames}
          currentUserId={userId}
        />
        <TaskCommentInput taskId={task.id} currentUserId={userId} />
      </section>
    </div>
  );
}
