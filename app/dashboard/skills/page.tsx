import Link from "next/link";

import { BusinessSelector } from "@/components/business-selector";
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
  const businesses = await loadUserBusinesses();

  const [skillsOverview, agents] = await Promise.all([
    listSkillsOverviewByBusiness(businessId),
    listAgentSummariesByBusiness(businessId),
  ]);

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
        <p className="text-muted-foreground text-sm">
          Install multi-file skills (<span className="font-mono">SKILL.md</span> plus references),
          then attach them to agents via checkboxes or from each agent&apos;s edit page.
        </p>
      </div>

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      <SkillsDashboard businessId={businessId} skills={skillsOverview} agents={agents} />

      <p className="text-muted-foreground text-xs">
        Webhook endpoint and MCP library live under{" "}
        <Link href={`/dashboard/settings?businessId=${encodeURIComponent(businessId)}`} className="text-primary underline">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
