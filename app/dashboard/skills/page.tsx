import Link from "next/link";

import { BusinessSelector } from "@/components/business-selector";
import { SkillsDashboard } from "@/components/skills/skills-dashboard";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
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
    <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
      <PageHeader
        breadcrumb={
          <div>
            <h1 className="text-foreground text-lg font-semibold">Skills</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Install multi-file skills (<span className="font-mono">SKILL.md</span> plus references),
              then attach them to agents. Open a skill to browse files and preview content.
            </p>
          </div>
        }
        actions={
          <Button asChild variant="outline" className="cursor-pointer">
            <Link href={`/dashboard/settings?businessId=${encodeURIComponent(businessId)}&section=mcp`}>
              MCP library
            </Link>
          </Button>
        }
        className="px-0 pt-0"
      />

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      <div className="mt-6">
        <SkillsDashboard businessId={businessId} skills={skillsOverview} agents={agents} />
      </div>
    </PageWrapper>
  );
}
