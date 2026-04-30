"use client";

import { cn } from "@/lib/utils";

export type AgentStatusKind = "active" | "idle" | "paused" | "failed" | "offline";

const statusLabels: Record<AgentStatusKind, string> = {
  active: "Active",
  idle: "Idle",
  paused: "Paused",
  failed: "Failed",
  offline: "Offline",
};

export function StatusDot({
  status,
  className,
  title,
  "aria-label": ariaLabel,
}: {
  status: AgentStatusKind;
  className?: string;
  title?: string;
  "aria-label"?: string;
}) {
  const label = ariaLabel ?? title ?? statusLabels[status];

  return (
    <span
      role="img"
      aria-label={label}
      title={title ?? label}
      className={cn(
        "inline-flex size-2.5 shrink-0 rounded-full border-2 border-transparent",
        status === "active" &&
          "bg-status-active shadow-[0_0_0_1px_rgba(168,235,18,0.35)] animate-pulse",
        status === "idle" && "bg-status-idle",
        status === "paused" && "bg-status-paused",
        status === "failed" && "bg-status-failed",
        status === "offline" && "border-status-offline bg-transparent",
        className,
      )}
    />
  );
}
