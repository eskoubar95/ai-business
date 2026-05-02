import { SkillsDashboard } from "@/components/skills/skills-dashboard";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { listAgentSummariesByBusiness } from "@/lib/agents/actions";
import { listSkillsOverviewByBusiness } from "@/lib/skills/actions";

export const dynamic = "force-dynamic";

export default async function SkillsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/skills");

  const [skillsOverview, agents] = await Promise.all([
    listSkillsOverviewByBusiness(businessId),
    listAgentSummariesByBusiness(businessId),
  ]);

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <SkillsDashboard businessId={businessId} skills={skillsOverview} agents={agents} />
    </div>
  );
}
