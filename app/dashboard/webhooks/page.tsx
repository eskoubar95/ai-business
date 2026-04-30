import Link from "next/link";

import {
  WEBHOOK_DELIVERED_STATUS,
  WEBHOOK_FAILED_STATUS,
  WEBHOOK_PENDING_STATUS,
} from "@/lib/webhooks/engine";
import { listWebhookDeliveriesByBusiness } from "@/lib/webhooks/deliveries-queries";
import { loadUserBusinesses, resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

export const dynamic = "force-dynamic";

function statusStyle(status: string) {
  if (status === WEBHOOK_DELIVERED_STATUS) {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }
  if (status === WEBHOOK_FAILED_STATUS) {
    return "bg-red-500/15 text-red-700 dark:text-red-400";
  }
  if (status === WEBHOOK_PENDING_STATUS) {
    return "bg-muted text-muted-foreground";
  }
  return "bg-muted text-muted-foreground";
}

export default async function WebhooksDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/webhooks");
  const businesses = await loadUserBusinesses();
  const deliveries = await listWebhookDeliveriesByBusiness(businessId);

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Webhook deliveries</h1>
        <p className="text-muted-foreground text-sm">
          Recent webhook rows for this business (type, status, attempts).
        </p>
      </div>

      <nav aria-label="Business scope" className="text-muted-foreground flex flex-wrap gap-2 text-sm">
        <span className="font-medium text-foreground">Business:</span>
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/webhooks?businessId=${encodeURIComponent(b.id)}`}
            className={
              b.id === businessId
                ? "text-foreground font-semibold underline"
                : "hover:text-foreground underline-offset-4 hover:underline"
            }
          >
            {b.name}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-lg border" data-testid="webhook-deliveries-table">
        {deliveries.length === 0 ? (
          <p className="text-muted-foreground p-6 text-sm">No webhook deliveries recorded yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Attempts</th>
                <th className="px-3 py-2">Idempotency key</th>
                <th className="px-3 py-2">Last error</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="px-3 py-2 whitespace-nowrap">{d.createdAt.toISOString()}</td>
                  <td className="px-3 py-2">{d.type}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${statusStyle(d.status)}`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{d.attempts}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.idempotencyKey}</td>
                  <td className="text-muted-foreground max-w-xs truncate px-3 py-2 text-xs">
                    {d.lastError ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
