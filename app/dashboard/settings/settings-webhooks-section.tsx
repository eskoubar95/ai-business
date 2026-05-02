import { WebhookDeliveriesTable } from "@/components/webhooks/webhook-deliveries-table";
import { loadSettingsIntegrationsPanel } from "@/lib/settings/integrations-panel";
import { listWebhookDeliveriesByBusiness } from "@/lib/webhooks/deliveries-queries";

import { WebhookUrlCopy } from "./webhook-url-copy";

export async function SettingsWebhooksSection({ businessId }: { businessId: string }) {
  const [integrations, deliveries] = await Promise.all([
    loadSettingsIntegrationsPanel(businessId),
    listWebhookDeliveriesByBusiness(businessId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex max-w-xl flex-col gap-4">
        {/* Endpoint URL */}
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground/30">
            Endpoint URL
          </p>
          <WebhookUrlCopy url={integrations.webhookEndpoint} />
        </div>

        {/* Instructions */}
        <div className="rounded-md border border-white/[0.07] bg-white/[0.02] px-4 py-3 flex flex-col gap-1.5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground/30 mb-1">
            Usage
          </p>
          <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
            POST JSON to this URL with headers{" "}
            <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px] text-foreground/60">
              X-Idempotency-Key
            </code>{" "}
            and{" "}
            <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px] text-foreground/60">
              X-Webhook-Signature
            </code>{" "}
            (HMAC-SHA256 hex). Uses server secret{" "}
            <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px] text-foreground/60">
              WEBHOOK_SECRET
            </code>
            .
          </p>
        </div>

        <p className="text-[12px] text-muted-foreground/40">
          Recorded deliveries:{" "}
          <span className="text-foreground/60 font-medium tabular-nums">
            {integrations.webhookDeliveryCount}
          </span>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground/30 mb-0.5">
            Delivery log
          </p>
          <p className="text-[11px] text-muted-foreground/35">
            Recent webhook rows for this workspace (type, status, attempts).
          </p>
        </div>
        <WebhookDeliveriesTable deliveries={deliveries} />
      </section>
    </div>
  );
}
