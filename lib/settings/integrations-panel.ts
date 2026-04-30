"use server";

import { countWebhookDeliveriesByBusiness } from "@/lib/webhooks/deliveries-queries";
import { getMcpLibraryBoard } from "@/lib/mcp/actions";
import { getPublicOrigin } from "@/lib/http/site-origin";

export type SettingsIntegrationsPanel = {
  webhookEndpoint: string;
  webhookDeliveryCount: number;
  mcpBoard: Awaited<ReturnType<typeof getMcpLibraryBoard>>;
};

/** Single round-trip for Settings → MCP library + webhook inbound summary. */
export async function loadSettingsIntegrationsPanel(
  businessId: string,
): Promise<SettingsIntegrationsPanel> {
  const [origin, deliveryCount, mcpBoard] = await Promise.all([
    getPublicOrigin(),
    countWebhookDeliveriesByBusiness(businessId),
    getMcpLibraryBoard(businessId),
  ]);

  return {
    webhookEndpoint: `${origin}/api/webhooks/${businessId}/receive`,
    webhookDeliveryCount: deliveryCount,
    mcpBoard,
  };
}
