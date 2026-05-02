"use client";

import { Bot } from "lucide-react";

import { cn } from "@/lib/utils";

import { StatusDot, type AgentStatusKind } from "./status-dot";

export function AgentAvatar({
  name,
  src,
  status = "idle",
  className,
  size = "md",
}: {
  name: string;
  src?: string | null;
  status?: AgentStatusKind;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className={cn("relative inline-flex", className)}>
      <span
        className={cn(
          "bg-muted text-muted-foreground border-border flex items-center justify-center overflow-hidden rounded-full border",
          size === "sm" && "size-8 text-xs",
          size === "md" && "size-10 text-sm",
          size === "lg" && "size-12 text-base",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic user / external URLs
          <img src={src} alt="" className="size-full object-cover" />
        ) : initial.match(/^[A-Z0-9]$/) ? (
          <span className="font-medium">{initial}</span>
        ) : (
          <Bot className="text-muted-foreground size-1/2" aria-hidden />
        )}
      </span>
      <span className="ring-sidebar absolute -right-0.5 -bottom-0.5 rounded-full ring-2">
        <StatusDot status={status} className="size-2" />
      </span>
    </div>
  );
}
