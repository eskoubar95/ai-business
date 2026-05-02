"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutGrid, List, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type TeamListItem = {
  id: string;
  name: string;
  leadName: string | null;
  memberCount: number;
};

function TeamMonogram({ name }: { name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.07] font-mono text-[11px] font-semibold text-foreground/50">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function TeamsHubClient({
  businessId,
  teams,
}: {
  businessId: string;
  teams: TeamListItem[];
}) {
  const [view, setView] = useState<"cards" | "list">("cards");

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
          <Users className="size-5 text-muted-foreground/40" />
        </div>
        <p className="text-[14px] font-medium text-foreground">No teams yet</p>
        <p className="mt-1 text-[13px] text-muted-foreground/50">
          Teams group agents under a lead for sprint-style flows.
        </p>
        <Link
          href={`/dashboard/teams/new?businessId=${encodeURIComponent(businessId)}`}
          data-testid="teams-empty-cta"
          className="mt-5 flex cursor-pointer items-center gap-1.5 rounded-md border border-white/[0.10] px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-white/[0.18] hover:bg-white/[0.04]"
        >
          <Plus className="size-3.5" />
          Create first team
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="section-label">
          {teams.length} {teams.length === 1 ? "team" : "teams"}
        </p>

        {/* View toggle */}
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setView("cards")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors",
              view === "cards"
                ? "bg-white/[0.08] text-foreground"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-3.5" />
            Cards
          </button>
          <div className="w-px bg-white/[0.08]" />
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors",
              view === "list"
                ? "bg-white/[0.08] text-foreground"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            <List className="size-3.5" />
            List
          </button>
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* Cards */}
      {view === "cards" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/teams/${t.id}?businessId=${encodeURIComponent(businessId)}`}
              data-testid={`team-card-${t.id}`}
              className={cn(
                "group flex flex-col rounded-md border border-border bg-card p-4",
                "hover:border-white/[0.14] hover:bg-white/[0.02] transition-all duration-150",
              )}
            >
              <div className="flex items-start gap-3">
                <TeamMonogram name={t.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-foreground">
                    {t.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
                    Lead: {t.leadName ?? "—"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-white/[0.05] pt-3">
                <span className="font-mono text-[11px] text-muted-foreground/60">
                  {t.memberCount} {t.memberCount === 1 ? "member" : "members"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List */
        <div className="mt-4 rounded-md border border-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_160px_80px] border-b border-white/[0.07] px-4 py-2">
            <span className="section-label">Team</span>
            <span className="section-label">Lead agent</span>
            <span className="section-label">Members</span>
          </div>
          {teams.map((t, i) => (
            <Link
              key={t.id}
              href={`/dashboard/teams/${t.id}?businessId=${encodeURIComponent(businessId)}`}
              data-testid={`team-card-${t.id}`}
              className={cn(
                "grid grid-cols-[1fr_160px_80px] items-center px-4 py-3 transition-colors hover:bg-white/[0.02]",
                i < teams.length - 1 ? "border-b border-white/[0.05]" : "",
              )}
            >
              <div className="flex items-center gap-2.5">
                <TeamMonogram name={t.name} />
                <span className="text-[13px] font-medium text-foreground">{t.name}</span>
              </div>
              <span className="text-[12px] text-muted-foreground/70">{t.leadName ?? "—"}</span>
              <span className="font-mono text-[12px] text-muted-foreground/60">{t.memberCount}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
