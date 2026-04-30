"use client";

import ReactMarkdown from "react-markdown";

import type { TaskLogAuthorType } from "@/lib/tasks/log-actions";

export type TaskLogFeedEntry = {
  id: string;
  authorType: TaskLogAuthorType;
  authorId: string;
  content: string;
  createdAt: Date;
};

export function TaskLogFeed({
  logs,
  agentNames,
  currentUserId,
}: {
  logs: TaskLogFeedEntry[];
  agentNames: Record<string, string>;
  currentUserId: string;
}) {
  if (logs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="task-log-empty">
        No activity yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4" data-testid="task-log-feed">
      {logs.map((log) => {
        const label =
          log.authorType === "human" && log.authorId === currentUserId
            ? "You"
            : log.authorType === "agent"
              ? (agentNames[log.authorId] ?? `Agent ${log.authorId.slice(0, 8)}`)
              : log.authorType === "human"
                ? "Teammate"
                : log.authorId;

        return (
          <li
            key={log.id}
            data-testid={`task-log-entry-${log.id}`}
            className="border-border rounded-lg border px-4 py-3 text-sm"
          >
            <div className="text-muted-foreground mb-2 flex flex-wrap items-baseline gap-2 text-xs">
              <span className="text-foreground font-medium">{label}</span>
              <time dateTime={log.createdAt.toISOString()}>
                {log.createdAt.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </div>
            <div className="text-foreground text-sm [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_li]:my-0.5 [&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
              <ReactMarkdown>{log.content}</ReactMarkdown>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
