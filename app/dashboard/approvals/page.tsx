import Link from "next/link";

import { ApprovalsBoardClient } from "@/components/approvals/approvals-board-client";
import { BusinessSelector } from "@/components/business-selector";
import { PageEmptyState } from "@/components/page-empty-state";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { listApprovalsGroupedForBusiness } from "@/lib/approvals/queries";
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
  const grouped = await listApprovalsGroupedForBusiness(businessId);

  const isCompletelyEmpty =
    grouped.pending.length === 0 &&
    grouped.approved.length === 0 &&
    grouped.rejected.length === 0;

  return (
    <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
      <PageHeader
        breadcrumb={
          <div>
            <h1 className="text-foreground text-lg font-semibold">Approvals</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Human gates for artifacts and agent output — pending, approved, and rejected.
            </p>
          </div>
        }
        className="px-0 pt-0"
      />

      <BusinessSelector businesses={businesses} currentBusinessId={businessId} />

      {isCompletelyEmpty ? (
        <PageEmptyState
          title="Nothing in approvals yet"
          description="When agents pause for a human gate, items land in Pending. After you decide, they move to Approved or Rejected with full history on the detail page."
          testId="approvals-empty"
        >
          <Button variant="outline" asChild>
            <Link href={`/dashboard/tasks?businessId=${encodeURIComponent(businessId)}`}>
              View tasks
            </Link>
          </Button>
        </PageEmptyState>
      ) : (
        <ApprovalsBoardClient businessId={businessId} grouped={grouped} />
      )}
    </PageWrapper>
  );
}
