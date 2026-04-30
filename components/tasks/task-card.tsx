import Link from "next/link";

import type { TaskRow } from "@/lib/tasks/task-tree";

import type { TaskStatus } from "@/lib/tasks/actions";

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  blocked: "Blocked",
  in_review: "In review",
  done: "Done",
};

export function TaskCard({
  task,
  businessId,
  agentName,
  teamName,
}: {
  task: TaskRow;
  businessId: string;
  agentName: string | null;
  teamName: string | null;
}) {
  const href = `/dashboard/tasks/${task.id}?businessId=${encodeURIComponent(businessId)}`;

  return (
    <Link
      href={href}
      data-testid={`task-card-${task.id}`}
      className="border-border bg-card hover:border-primary/40 block rounded-lg border p-3 text-sm shadow-sm transition-colors"
    >
      <span className="text-foreground block font-medium leading-snug">{task.title}</span>
      <span className="text-muted-foreground mt-2 block text-xs">
        {agentName ? <>Assigned: {agentName}</> : <>Unassigned</>}
        {teamName ? (
          <>
            {" · "}
            Team: {teamName}
          </>
        ) : null}
      </span>
      <span className="text-muted-foreground mt-1 block text-[10px] uppercase tracking-wide">
        {STATUS_LABEL[task.status]}
      </span>
      {task.status === "blocked" && task.blockedReason ? (
        <span className="text-destructive mt-2 line-clamp-2 block text-xs">{task.blockedReason}</span>
      ) : null}
    </Link>
  );
}
