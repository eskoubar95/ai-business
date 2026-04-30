import { WebhookDeliveriesTable } from "@/components/webhooks/webhook-deliveries-table";
import { loadSettingsIntegrationsPanel } from "@/lib/settings/integrations-panel";
import { listWebhookDeliveriesByBusiness } from "@/lib/webhooks/deliveries-queries";

export async function SettingsWebhooksSection({ businessId }: { businessId: string }) {
  const [integrations, deliveries] = await Promise.all([
    loadSettingsIntegrationsPanel(businessId),
    listWebhookDeliveriesByBusiness(businessId),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Inbound webhooks</h2>
          <p className="text-muted-foreground text-sm">
            POST JSON to this URL with headers{" "}
            <span className="font-mono text-xs">X-Idempotency-Key</span>,{" "}
            <span className="font-mono text-xs">X-Webhook-Signature</span> (HMAC-SHA256 hex). Uses server
            secret <span className="font-mono text-xs">WEBHOOK_SECRET</span>.
          </p>
        </div>
        <code
          className="border-border bg-muted/40 block break-all rounded-md border p-3 text-xs"
          data-testid="settings-webhook-endpoint"
        >
          {integrations.webhookEndpoint}
        </code>
        <p className="text-muted-foreground text-sm">
          Recorded deliveries for this business:{" "}
          <span className="text-foreground font-medium">{integrations.webhookDeliveryCount}</span>.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Delivery log</h2>
        <p className="text-muted-foreground text-sm">
          Recent webhook rows for this business (type, status, attempts).
        </p>
        <WebhookDeliveriesTable deliveries={deliveries} />
      </section>
    </div>
  );
}
