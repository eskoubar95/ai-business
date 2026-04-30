import Link from "next/link";

import { BusinessSelector } from "@/components/business-selector";
import { TeamsHubClient } from "@/components/teams/teams-hub-client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { listTeamsByBusiness } from "@/lib/teams/actions";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

export const dynamic = "force-dynamic";

export default async function TeamsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/teams");
  const businesses = await loadUserBusinesses();
  const teams = await listTeamsByBusiness(businessId);

  const teamItems = teams.map((t) => ({
    id: t.id,
    name: t.name,
    leadName: t.leadAgent?.name ?? null,
    memberCount: t.members?.length ?? 0,
  }));

  const emptyCta = (
    <Button asChild data-testid="teams-empty-cta">
      <Link href={`/dashboard/teams/new?businessId=${encodeURIComponent(businessId)}`}>
        Create team
      </Link>
    </Button>
  );

  return (
    <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
      <PageHeader
        breadcrumb={
          <div>
            <h1 className="text-foreground text-lg font-semibold">Teams</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Teams, leads, and roster groupings.
            </p>
          </div>
        }
        actions={
          <Button asChild className="cursor-pointer" data-testid="teams-new">
            <Link href={`/dashboard/teams/new?businessId=${encodeURIComponent(businessId)}`}>
              New team
            </Link>
          </Button>
        }
        className="px-0 pt-0"
      />

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      <TeamsHubClient businessId={businessId} teams={teamItems} emptyCta={emptyCta} />
    </PageWrapper>
  );
}
