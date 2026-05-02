"use client";

import { Crown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamDetailTeam } from "@/components/teams/team-detail-types";

function monogram(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

type Props = {
  team: TeamDetailTeam;
};

export function TeamMembersSection({ team }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-[1fr_1fr_80px_80px_100px] gap-4 border-b border-white/[0.07] px-4 py-2">
          <span className="section-label">Agent</span>
          <span className="section-label">Role</span>
          <span className="section-label">Skills</span>
          <span className="section-label">MCP</span>
          <span className="section-label">Status</span>
        </div>

        {team.members.length === 0 ? (
          <div className="flex h-20 items-center justify-center">
            <p className="text-[13px] text-muted-foreground">No members yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {team.members.map((m) => {
              const isLead = m.agentId === team.leadAgentId;
              const name = m.agent?.name ?? m.agentId;
              const role = m.agent?.role ?? "—";
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_1fr_80px_80px_100px] items-center gap-4 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-semibold",
                        isLead ? "bg-primary/15 text-primary" : "bg-white/[0.07] text-muted-foreground",
                      )}
                    >
                      {monogram(name)}
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium text-foreground">{name}</span>
                      {isLead && <Crown className="size-3 shrink-0 text-primary/70" />}
                    </div>
                  </div>

                  <span className="truncate text-[13px] text-muted-foreground">{role}</span>

                  <span className="text-[13px] text-muted-foreground">—</span>

                  <span className="text-[13px] text-muted-foreground">—</span>

                  <span className="inline-flex w-fit items-center rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
                    idle
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className="flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-white/[0.14] hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add member
      </button>
    </div>
  );
}
