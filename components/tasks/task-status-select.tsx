"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import type { TaskStatus } from "@/lib/tasks/actions";
import { updateTaskStatus } from "@/lib/tasks/actions";

const OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
];

export function TaskStatusSelect({
  taskId,
  initialStatus,
}: {
  taskId: string;
  initialStatus: TaskStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" htmlFor="task-detail-status">
        Status
      </label>
      <select
        id="task-detail-status"
        data-testid="task-detail-status"
        className="border-border bg-background max-w-xs rounded-md border px-3 py-2 text-sm"
        disabled={pending}
        value={initialStatus}
        onChange={(e) => {
          const next = e.target.value as TaskStatus;
          startTransition(async () => {
            try {
              await updateTaskStatus(taskId, next);
              toast.success("Status updated.");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Update failed");
            }
          });
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
