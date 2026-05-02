"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { McpLibrary } from "@/components/mcp/mcp-library";
import { loadSettingsIntegrationsPanel, type SettingsIntegrationsPanel } from "@/lib/settings/integrations-panel";

export function SettingsMcpSection({ businessId }: { businessId: string }) {
  const [integrations, setIntegrations] = useState<SettingsIntegrationsPanel | null>(null);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setIntegrations(null);
      setIntegrationsLoading(false);
      return;
    }
    let cancelled = false;
    setIntegrationsLoading(true);
    loadSettingsIntegrationsPanel(businessId)
      .then((data) => {
        if (!cancelled) setIntegrations(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load integrations.");
      })
      .finally(() => {
        if (!cancelled) setIntegrationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return (
    <section className="flex flex-col gap-4">
      {integrationsLoading ? (
        <p className="text-[12px] text-muted-foreground/40">Loading MCP library…</p>
      ) : integrations ? (
        <McpLibrary
          businessId={businessId}
          board={integrations.mcpBoard}
          onChanged={() => loadSettingsIntegrationsPanel(businessId).then(setIntegrations)}
        />
      ) : (
        <p className="text-[12px] text-muted-foreground/40">Could not load MCP library.</p>
      )}
    </section>
  );
}
