import {
  WEBHOOK_DELIVERED_STATUS,
  WEBHOOK_FAILED_STATUS,
  WEBHOOK_PENDING_STATUS,
} from "@/lib/webhooks/engine";
import { webhookDeliveries } from "@/db/schema";

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

export function WebhookDeliveriesTable({
  deliveries,
}: {
  deliveries: (typeof webhookDeliveries.$inferSelect)[];
}) {
  return (
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
  );
}
