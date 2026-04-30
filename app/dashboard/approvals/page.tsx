import Link from "next/link";

import { ApprovalCard } from "@/components/approvals/approval-card";
import { listPendingApprovalsForBusiness } from "@/lib/approvals/queries";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/approvals");
  const businesses = await loadUserBusinesses();
  const pending = await listPendingApprovalsForBusiness(businessId);

  const serialized = pending.map((p) => ({
    id: p.id,
    artifactRef: p.artifactRef as Record<string, unknown>,
    createdAt: p.createdAt.toISOString(),
    agentId: p.agentId,
    agentName: p.agentName,
  }));

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground text-sm">
            Pending human gates for artifacts and agent output.
          </p>
        </div>
      </div>

      <nav aria-label="Business scope" className="text-muted-foreground flex flex-wrap gap-2 text-sm">
        <span className="font-medium text-foreground">Business:</span>
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/approvals?businessId=${encodeURIComponent(b.id)}`}
            className={
              b.id === businessId
                ? "text-foreground font-semibold underline"
                : "hover:text-foreground underline-offset-4 hover:underline"
            }
            data-testid={`approvals-business-${b.id}`}
          >
            {b.name}
          </Link>
        ))}
      </nav>

      <section data-testid="approvals-queue" className="flex flex-col gap-3">
        {serialized.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="approvals-empty">
            Queue is empty — nothing awaiting approval.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {serialized.map((item) => (
              <li key={item.id}>
                <ApprovalCard approval={item} businessId={businessId} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
