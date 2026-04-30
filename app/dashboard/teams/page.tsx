import Link from "next/link";

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
        <Link
          href={`/dashboard/teams/new?businessId=${encodeURIComponent(businessId)}`}
          data-testid="teams-new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex rounded-md px-4 py-2 text-sm font-medium"
        >
          New team
        </Link>
      </div>

      <nav aria-label="Business scope" className="text-muted-foreground flex flex-wrap gap-2 text-sm">
        <span className="font-medium text-foreground">Business:</span>
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/teams?businessId=${encodeURIComponent(b.id)}`}
            className={
              b.id === businessId
                ? "text-foreground font-semibold underline"
                : "hover:text-foreground underline-offset-4 hover:underline"
            }
            data-testid={`teams-business-${b.id}`}
          >
            {b.name}
          </Link>
        ))}
      </nav>

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
