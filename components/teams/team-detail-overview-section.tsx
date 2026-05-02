"use client";

import { Crown } from "lucide-react";
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

export function TeamOverviewSection({ team }: { team: TeamDetailTeam }) {
  const memberCount = team.members.length;
  const leadName = team.leadAgent?.name ?? "—";

  const stats = [
    { label: "Members", value: String(memberCount) },
    { label: "Lead Agent", value: leadName },
    { label: "Active Tasks", value: "0" },
    { label: "Skills", value: "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-border bg-card px-4 py-3"
          >
            <p className="section-label mb-1">{s.label}</p>
            <p className="truncate text-[15px] font-medium text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <p className="section-label">Team Members</p>
        {team.members.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-md border border-border border-dashed">
            <p className="text-[13px] text-muted-foreground">
              No members yet — add agents to this team
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {team.members.map((m) => {
              const isLead = m.agentId === team.leadAgentId;
              const name = m.agent?.name ?? m.agentId;
              const role = m.agent?.role ?? "—";
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:border-white/[0.14]"
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-semibold",
                      isLead ? "bg-primary/15 text-primary" : "bg-white/[0.07] text-muted-foreground",
                    )}
                  >
                    {monogram(name)}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium text-foreground leading-tight">
                        {name}
                      </span>
                      {isLead && (
                        <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-primary/70">
                          <Crown className="size-2.5" />
                          Lead
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[11px] text-muted-foreground leading-tight">
                      {role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
