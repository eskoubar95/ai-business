import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, Users, Zap } from "lucide-react";

import { getTeamWithMembers } from "@/lib/teams/actions";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { getDb } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TeamDetailTabs } from "@/components/teams/team-detail-tabs";

export const dynamic = "force-dynamic";

function monogram(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ businessId?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/teams");

  const team = await getTeamWithMembers(teamId);
  if (!team || team.businessId !== businessId) notFound();

  const db = getDb();
  const businessAgents = await db.query.agents.findMany({
    where: eq(agents.businessId, businessId),
    columns: { id: true, name: true, role: true },
  });

  const memberCount = team.members.length;
  const leadName = team.leadAgent?.name ?? "—";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <nav className="flex items-center gap-2 text-[13px]">
          <Link
            href={`/dashboard/teams?businessId=${encodeURIComponent(businessId)}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Teams
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-foreground">{team.name}</span>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] text-muted-foreground transition-colors hover:border-white/[0.14] hover:text-foreground">
            <Users className="size-3.5" />
            Add member
          </button>
          <button
            className="group relative flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-white transition-all duration-200"
            style={{
              border: "1px solid transparent",
              background: "linear-gradient(#141414, #141414) padding-box, linear-gradient(135deg, rgba(168,235,18,0.8) 0%, rgba(80,140,0,0.5) 100%) border-box",
            }}
          >
            {/* Gradient fill — subtle, brightens on hover */}
            <span
              className="absolute inset-0 rounded-md transition-opacity duration-200"
              style={{ background: "linear-gradient(135deg, rgba(168,235,18,0.18) 0%, rgba(80,140,0,0.08) 100%)", opacity: 1 }}
            />
            <span
              className="absolute inset-0 rounded-md opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ background: "linear-gradient(135deg, rgba(168,235,18,0.28) 0%, rgba(80,140,0,0.14) 100%)" }}
            />
            <Zap className="relative size-3.5 shrink-0 text-primary" />
            <span className="relative">Run Sprint</span>
          </button>
        </div>
      </div>

      {/* Identity strip */}
      <div className="flex items-center gap-4 border-b border-white/[0.06] px-6 py-4">
        {/* Monogram */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 font-mono text-[14px] font-semibold text-primary">
          {monogram(team.name)}
        </div>

        {/* Name + meta */}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground">
            {team.name}
          </h1>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Crown className="size-3 text-primary/60" />
              {leadName}
            </span>
            <span>·</span>
            <span>
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TeamDetailTabs
        team={{
          id: team.id,
          name: team.name,
          businessId: team.businessId,
          leadAgentId: team.leadAgentId,
          leadAgent: team.leadAgent
            ? {
                id: team.leadAgent.id,
                name: team.leadAgent.name,
                role: team.leadAgent.role,
              }
            : null,
          members: team.members.map((m) => ({
            id: m.id,
            agentId: m.agentId,
            sortOrder: m.sortOrder,
            agent: m.agent
              ? {
                  id: m.agent.id,
                  name: m.agent.name,
                  role: m.agent.role,
                }
              : null,
          })),
        }}
        businessAgents={businessAgents.map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
        }))}
      />
    </div>
  );
}
