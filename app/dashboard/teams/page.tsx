import Link from "next/link";

import { BusinessSelector } from "@/components/business-selector";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-muted-foreground text-sm">Teams, leads, and roster groupings.</p>
        </div>
        <Button asChild data-testid="teams-new">
          <Link href={`/dashboard/teams/new?businessId=${encodeURIComponent(businessId)}`}>
            New team
          </Link>
        </Button>
      </div>

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      <ul className="flex flex-col gap-2">
        {teams.length === 0 ? (
          <li className="text-muted-foreground text-sm">
            No teams yet.{" "}
            <Link href={`/dashboard/teams/new?businessId=${businessId}`} className="text-primary underline">
              Create one
            </Link>
            .
          </li>
        ) : (
          teams.map((t) => (
            <li key={t.id}>
              <Link
                href={`/dashboard/teams/${t.id}?businessId=${encodeURIComponent(businessId)}`}
                data-testid={`team-card-${t.id}`}
                className="border-border hover:bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3"
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground text-sm">
                  Lead: {t.leadAgent?.name ?? "—"} · {t.members?.length ?? 0} members
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
