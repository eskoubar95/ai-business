"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import { PageEmptyState } from "@/components/page-empty-state";
import { RightPanel } from "@/components/ui/right-panel";
import { Button } from "@/components/ui/button";

export type TeamListItem = {
  id: string;
  name: string;
  leadName: string | null;
  memberCount: number;
};

export function TeamsHubClient({
  businessId,
  teams,
  emptyCta,
}: {
  businessId: string;
  teams: TeamListItem[];
  emptyCta: ReactNode;
}) {
  const [view, setView] = useState<"cards" | "list">("cards");
  const [openId, setOpenId] = useState<string | null>(null);

  const selected = useMemo(() => teams.find((t) => t.id === openId) ?? null, [teams, openId]);

  if (teams.length === 0) {
    return (
      <PageEmptyState
        title="No teams yet"
        description="Teams group agents under a lead for sprint-style flows."
      >
        {emptyCta}
      </PageEmptyState>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="bg-muted text-muted-foreground inline-flex rounded-md p-1">
          <Button
            type="button"
            variant={view === "cards" ? "secondary" : "ghost"}
            size="sm"
            className="cursor-pointer"
            onClick={() => setView("cards")}
          >
            <LayoutGrid className="size-4" />
            Cards
          </Button>
          <Button
            type="button"
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="cursor-pointer"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
            List
          </Button>
        </div>
      </div>

      {view === "cards" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`team-card-${t.id}`}
              className="border-border bg-card hover:border-primary/40 cursor-pointer rounded-lg border p-4 text-left transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-md"
              onClick={() => setOpenId(t.id)}
            >
              <div className="text-foreground font-medium">{t.name}</div>
              <div className="text-muted-foreground mt-2 text-sm">
                Lead: {t.leadName ?? "—"} · {t.memberCount} members
              </div>
            </button>
          ))}
        </div>
      ) : (
        <ul className="border-border divide-border mt-6 divide-y rounded-lg border">
          {teams.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                data-testid={`team-card-${t.id}`}
                className="hover:bg-accent/50 flex w-full cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition-colors"
                onClick={() => setOpenId(t.id)}
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground text-sm">
                  Lead: {t.leadName ?? "—"} · {t.memberCount} members
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <RightPanel
        open={Boolean(selected)}
        onOpenChange={(o) => {
          if (!o) {
            setOpenId(null);
          }
        }}
        title={selected?.name ?? "Team"}
      >
        {selected ? (
          <div className="flex flex-col gap-4 text-sm">
            <p className="text-muted-foreground">
              Lead:{" "}
              <span className="text-foreground font-medium">{selected.leadName ?? "—"}</span>
            </p>
            <p className="text-muted-foreground">{selected.memberCount} members</p>
            <Button asChild className="cursor-pointer" variant="secondary">
              <Link href={`/dashboard/teams/${selected.id}?businessId=${encodeURIComponent(businessId)}`}>
                Open full page
              </Link>
            </Button>
          </div>
        ) : null}
      </RightPanel>
    </>
  );
}
