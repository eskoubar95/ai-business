import Link from "next/link";

import { OrchestrationEventsTable } from "@/components/orchestration/orchestration-events-table";
import { WebhookDeliveriesTable } from "@/components/webhooks/webhook-deliveries-table";
import { WebhookUrlCopy } from "@/app/dashboard/settings/webhook-url-copy";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { listOrchestrationEventsByBusiness } from "@/lib/orchestration/event-queries";
import { loadSettingsIntegrationsPanel } from "@/lib/settings/integrations-panel";
import { listWebhookDeliveriesByBusiness } from "@/lib/webhooks/deliveries-queries";

export const dynamic = "force-dynamic";

export default async function WebhooksActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/webhooks");

  const [integrations, deliveries, events] = await Promise.all([
    loadSettingsIntegrationsPanel(businessId),
    listWebhookDeliveriesByBusiness(businessId, 75),
    listOrchestrationEventsByBusiness(businessId, 80),
  ]);

  const settingsHref = `/dashboard/settings?businessId=${encodeURIComponent(businessId)}&section=webhooks`;

  return (
    <div className="flex min-h-full flex-col pb-16">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div>
          <p className="section-label mb-0.5">Workspace</p>
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground">Activity &amp; webhooks</h1>
        </div>
        <Link
          href={settingsHref}
          className="cursor-pointer text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Open in Settings →
        </Link>
      </div>

      <div className="flex max-w-4xl flex-col gap-12 px-6 py-10">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="section-label text-muted-foreground/40">Delivery endpoint</p>
            <WebhookUrlCopy url={integrations.webhookEndpoint} />
            <p className="text-[11px] text-muted-foreground/45">
              HMAC-verified ingestion; creates <code className="text-[10px]">webhook_trigger</code> orchestration rows
              (pending) consumed by <code className="text-[10px]">npm run runner</code>.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <p className="section-label mb-0.5">Orchestration events</p>
            <p className="text-[11px] text-muted-foreground/35">
              Live feed of runner-relevant orchestration logs for this workspace.
            </p>
          </div>
          {events.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No orchestration events yet.</p>
          ) : (
            <OrchestrationEventsTable rows={events} />
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <p className="section-label mb-0.5">Webhook delivery log</p>
            <p className="text-[11px] text-muted-foreground/35">
              Rows: {integrations.webhookDeliveryCount}. Recent deliveries shown below.
            </p>
          </div>
          <WebhookDeliveriesTable deliveries={deliveries} />
        </section>
      </div>
    </div>
  );
}
