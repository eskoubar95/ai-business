"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TeamOrgChart } from "@/components/teams/team-org-chart";
import { TeamOverviewSection } from "@/components/teams/team-detail-overview-section";
import { TeamMembersSection } from "@/components/teams/team-detail-members-section";
import { TeamSettingsSection } from "@/components/teams/team-detail-settings-section";
import type { TeamDetailAgent, TeamDetailTeam } from "@/components/teams/team-detail-types";

const TABS = ["overview", "org-chart", "members", "settings"] as const;
type Tab = (typeof TABS)[number];

function tabLabel(tab: Tab): string {
  if (tab === "org-chart") return "Org Chart";
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

type Props = {
  team: TeamDetailTeam;
  businessAgents: TeamDetailAgent[];
};

export function TeamDetailTabs({ team, businessAgents }: Props) {
  const [active, setActive] = useState<Tab>("overview");
  const router = useRouter();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 border-b border-white/[0.07] px-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={cn(
              "relative mr-1 cursor-pointer px-3 py-3 text-[13px] transition-colors outline-none",
              "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[2px] before:rounded-t-full before:transition-colors",
              active === tab
                ? "text-foreground font-medium before:bg-primary"
                : "text-muted-foreground hover:text-foreground before:bg-transparent",
            )}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1",
          active === "org-chart"
            ? "flex flex-col overflow-hidden"
            : "overflow-y-auto p-6",
        )}
      >
        {active === "overview" && <TeamOverviewSection team={team} />}
        {active === "org-chart" && <OrgChartTab team={team} />}
        {active === "members" && <TeamMembersSection team={team} />}
        {active === "settings" && (
          <TeamSettingsSection
            team={team}
            businessAgents={businessAgents}
            onSaved={() => router.refresh()}
            onDeleted={() =>
              router.push(`/dashboard/teams?businessId=${encodeURIComponent(team.businessId)}`)
            }
          />
        )}
      </div>
    </div>
  );
}

function OrgChartTab({ team }: { team: TeamDetailTeam }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 py-3">
        <p className="section-label">Reporting Structure</p>
        <p className="text-[11px] text-muted-foreground/40">Drag nodes to rearrange</p>
      </div>
      <div className="min-h-0 flex-1">
        <TeamOrgChart members={team.members} leadAgentId={team.leadAgentId} />
      </div>
    </div>
  );
}
