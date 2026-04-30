"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { agents } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { createTask } from "@/lib/tasks/actions";
import type { TaskRow } from "@/lib/tasks/task-tree";

type AgentOption = Pick<typeof agents.$inferSelect, "id" | "name">;

type TeamOption = { id: string; name: string };

export function TaskCreateForm({
  businessId,
  agents: agentOptions,
  teams: teamOptions,
  tasksFlat,
}: {
  businessId: string;
  agents: AgentOption[];
  teams: TeamOption[];
  tasksFlat: Pick<TaskRow, "id" | "title">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agentId, setAgentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");

  const parentOptions = useMemo(
    () => tasksFlat.slice().sort((a, b) => a.title.localeCompare(b.title)),
    [tasksFlat],
  );

  function submit() {
    const t = title.trim();
    if (!t) {
      toast.error("Title is required");
      return;
    }

    startTransition(async () => {
      try {
        const { id } = await createTask(businessId, {
          title: t,
          description: description.trim(),
          agentId: agentId || null,
          teamId: teamId || null,
          parentTaskId: parentTaskId || null,
        });
        toast.success("Task created.");
        router.push(`/dashboard/tasks/${id}?businessId=${encodeURIComponent(businessId)}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Create failed");
      }
    });
  }

  return (
    <div className="flex max-w-lg flex-col gap-4" data-testid="task-create-form">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="task-new-title">
          Title
        </label>
        <input
          id="task-new-title"
          data-testid="task-new-title"
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="task-new-description">
          Description
        </label>
        <textarea
          id="task-new-description"
          data-testid="task-new-description"
          className="border-border bg-background min-h-[120px] rounded-md border px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="task-new-agent">
          Agent (optional)
        </label>
        <select
          id="task-new-agent"
          data-testid="task-new-agent"
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        >
          <option value="">— None —</option>
          {agentOptions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="task-new-team">
          Team (optional)
        </label>
        <select
          id="task-new-team"
          data-testid="task-new-team"
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        >
          <option value="">— None —</option>
          {teamOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="task-new-parent">
          Parent task (optional)
        </label>
        <select
          id="task-new-parent"
          data-testid="task-new-parent"
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          value={parentTaskId}
          onChange={(e) => setParentTaskId(e.target.value)}
        >
          <option value="">— None —</option>
          {parentOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Button type="button" data-testid="task-new-submit" disabled={pending} onClick={submit}>
          {pending ? "Creating…" : "Create task"}
        </Button>
      </div>
    </div>
  );
}
