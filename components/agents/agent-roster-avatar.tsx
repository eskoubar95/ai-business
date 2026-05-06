"use client";

import { cn } from "@/lib/utils";
import type { AgentPlatformIconId } from "@/lib/agents/agent-platform-icon-ids";
import { AGENT_PLATFORM_ICONS } from "@/components/agents/agent-platform-icons";

/**
 * Preferred display: uploaded image (`avatarUrl`) over platform icon, then initials.
 */
export function AgentRosterAvatar({
  name,
  avatarUrl,
  iconKey,
  className,
  sizeClasses = "size-8 rounded-md font-mono text-[11px]",
}: {
  name: string;
  avatarUrl?: string | null;
  iconKey?: string | null;
  className?: string;
  /** Tailwind sizing + rounding for wrapper (default matches roster cards). */
  sizeClasses?: string;
}) {
  const initials = name.slice(0, 2).toUpperCase() || "??";
  const normalizedKey =
    iconKey &&
    AGENT_PLATFORM_ICONS[iconKey as AgentPlatformIconId] !== undefined ?
      (iconKey as AgentPlatformIconId)
    : null;

  const IconComp = normalizedKey !== null ? AGENT_PLATFORM_ICONS[normalizedKey] : undefined;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden bg-white/[0.07]",
        sizeClasses,
        className,
      )}
    >
      {avatarUrl ?
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- user-upload or data URLs */}
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        </>
      : IconComp !== undefined ?
        <IconComp className="size-1/2 text-foreground/60" aria-hidden />
      : <span className="font-semibold text-foreground/60">{initials}</span>}
    </span>
  );
}
