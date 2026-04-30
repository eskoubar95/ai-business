import Link from "next/link";
import { notFound } from "next/navigation";

import { getTeamWithMembers } from "@/lib/teams/actions";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

import { OrgChart } from "@/components/agents/org-chart";

export const dynamic = "force-dynamic";

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

  const agentsForChart =
    team.members
      ?.map((m) => m.agent)
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .map((a) => ({
        id: a.id,
        name: a.name,
        reportsToAgentId: a.reportsToAgentId,
      })) ?? [];

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <Link
        href={`/dashboard/teams?businessId=${encodeURIComponent(businessId)}`}
        className="text-muted-foreground hover:text-foreground w-fit text-sm underline"
      >
        ← Teams
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
        <p className="text-muted-foreground text-sm">
          Lead:{" "}
          <span data-testid="team-lead-label" className="text-foreground font-medium">
            {team.leadAgent?.name ?? "—"}
          </span>
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Org chart</h2>
        <OrgChart agents={agentsForChart} highlightAgentId={team.leadAgentId} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Members</h2>
        <ul className="flex flex-col gap-2">
          {team.members?.map((m) => (
            <li
              key={m.id}
              data-testid={`team-member-${m.agentId}`}
              className="border-border flex flex-wrap justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span>{m.agent?.name ?? m.agentId}</span>
              {m.agentId === team.leadAgentId ? (
                <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                  Lead
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
