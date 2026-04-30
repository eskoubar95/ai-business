"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { KanbanBoard } from "@/components/ui/kanban-board";
import { updateTaskStatus, type TaskStatus } from "@/lib/tasks/actions";
import type { TaskRow } from "@/lib/tasks/task-tree";

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "backlog", title: "Backlog" },
  { id: "in_progress", title: "In Progress" },
  { id: "blocked", title: "Blocked" },
  { id: "in_review", title: "In Review" },
  { id: "done", title: "Done" },
];

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  blocked: "Blocked",
  in_review: "In review",
  done: "Done",
};

function buildColumnItemIds(grouped: Record<TaskStatus, TaskRow[]>) {
  const m: Record<string, string[]> = {};
  for (const c of COLUMNS) {
    m[c.id] = (grouped[c.id] ?? []).map((t) => t.id);
  }
  return m;
}

function findColumn(map: Record<string, string[]>, taskId: string) {
  for (const [col, ids] of Object.entries(map)) {
    if (ids.includes(taskId)) return col;
  }
  return undefined;
}

function buildItemMap(grouped: Record<TaskStatus, TaskRow[]>) {
  const m: Record<string, TaskRow> = {};
  for (const c of COLUMNS) {
    for (const t of grouped[c.id] ?? []) {
      m[t.id] = t;
    }
  }
  return m;
}

function TaskKanbanCardBody({
  task,
  businessId,
  agentName,
  teamName,
  onOpen,
}: {
  task: TaskRow;
  businessId: string;
  agentName: string | null;
  teamName: string | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="border-border bg-card hover:border-primary/40 w-full cursor-pointer rounded-lg border p-3 text-left text-sm shadow-sm transition-colors"
      data-testid={`task-card-${task.id}`}
      onClick={onOpen}
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
    </button>
  );
}

export function TasksKanbanBoard({
  grouped,
  agentNames,
  teamNames,
  businessId,
}: {
  grouped: Record<TaskStatus, TaskRow[]>;
  agentNames: Record<string, string>;
  teamNames: Record<string, string>;
  businessId: string;
}) {
  const router = useRouter();
  const [columnItemIds, setColumnItemIds] = useState(() => buildColumnItemIds(grouped));
  const prevRef = useRef(columnItemIds);

  useEffect(() => {
    const next = buildColumnItemIds(grouped);
    setColumnItemIds(next);
    prevRef.current = next;
  }, [grouped]);

  useEffect(() => {
    prevRef.current = columnItemIds;
  }, [columnItemIds]);

  const items = buildItemMap(grouped);

  const onColumnItemIdsChange = useCallback(
    (next: Record<string, string[]>) => {
      const prev = prevRef.current;
      const allIds = new Set([...Object.values(prev).flat(), ...Object.values(next).flat()]);
      for (const id of allIds) {
        const from = findColumn(prev, id);
        const to = findColumn(next, id);
        if (from && to && from !== to) {
          void updateTaskStatus(id, to as TaskStatus)
            .then(() => {
              router.refresh();
            })
            .catch(() => {
              router.refresh();
            });
          break;
        }
      }
      setColumnItemIds(next);
    },
    [router],
  );

  const openTask = useCallback(
    (taskId: string) => {
      router.push(`/dashboard/tasks/${taskId}?businessId=${encodeURIComponent(businessId)}`);
    },
    [router, businessId],
  );

  return (
    <KanbanBoard<TaskRow>
      columns={COLUMNS}
      columnItemIds={columnItemIds}
      getItem={(id) => items[id]}
      onColumnItemIdsChange={onColumnItemIdsChange}
      renderColumnHeader={(col, count) => (
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-sm font-semibold">{col.title}</span>
          <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
        </div>
      )}
      renderCard={(task) => (
        <TaskKanbanCardBody
          task={task}
          businessId={businessId}
          agentName={task.agentId ? (agentNames[task.agentId] ?? null) : null}
          teamName={task.teamId ? (teamNames[task.teamId] ?? null) : null}
          onOpen={() => openTask(task.id)}
        />
      )}
    />
  );
}
