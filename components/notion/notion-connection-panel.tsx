"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { saveMcpCredential } from "@/lib/mcp/actions";
import { MCP_TYPE_CONFIGS } from "@/lib/mcp/config";
import { runNotionSyncForBusiness } from "@/lib/notion/dashboard-actions";

type AgentOption = {
  id: string;
  name: string;
  hasNotion: boolean;
};

type Props = {
  businessId: string;
  agents: AgentOption[];
};

const notionConfig = MCP_TYPE_CONFIGS.find((c) => c.id === "notion")!;

export function NotionConnectionPanel({ businessId, agents }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultAgentId = agents[0]?.id ?? "";
  const [agentId, setAgentId] = useState(defaultAgentId);

  const initialFields = useMemo(() => {
    const o: Record<string, string> = {};
    for (const f of notionConfig.fields) {
      o[f.name] = "";
    }
    return o;
  }, []);

  const [fields, setFields] = useState<Record<string, string>>(initialFields);

  const selected = agents.find((a) => a.id === agentId);
  const connected = selected?.hasNotion ?? false;

  function saveCredentials() {
    setError(null);
    if (!agentId) {
      setError("Create an agent first.");
      return;
    }
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      payload[k] = v;
    }
    startTransition(async () => {
      try {
        await saveMcpCredential(agentId, "notion", payload);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function runSync() {
    setSyncMsg(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await runNotionSyncForBusiness(businessId);
        setSyncMsg(
          res.skippedReason
            ? `Skipped: ${res.skippedReason}`
            : `Synced ${res.count} task page(s).`,
        );
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sync failed");
      }
    });
  }

  if (agents.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="notion-no-agents">
        Add an agent under{" "}
        <Link href={`/dashboard/agents?businessId=${encodeURIComponent(businessId)}`} className="text-primary underline">
          Agents
        </Link>{" "}
        before saving Notion credentials.
      </p>
    );
  }

  return (
    <section className="border-border flex flex-col gap-4 rounded-lg border p-4" data-testid="notion-connection-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Notion integration</h2>
        <span
          data-testid="notion-connection-status"
          className={
            connected
              ? "bg-emerald-500/15 text-emerald-700 rounded-full px-3 py-1 text-xs font-medium"
              : "bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
          }
        >
          {connected ? "Connected for selected agent" : "Not connected"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="notion-agent">
          Agent (credential scope)
        </label>
        <select
          id="notion-agent"
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          data-testid="notion-agent-select"
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.hasNotion ? " · notion ✓" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        {notionConfig.fields.map((f) => (
          <div key={f.name} className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor={`notion-${f.name}`}>
              {f.label}
            </label>
            <input
              id={`notion-${f.name}`}
              type={f.type === "password" ? "password" : "text"}
              autoComplete="off"
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
              value={fields[f.name] ?? ""}
              onChange={(e) => setFields((prev) => ({ ...prev, [f.name]: e.target.value }))}
              data-testid={`notion-field-${f.name}`}
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {syncMsg ? <p className="text-muted-foreground text-sm">{syncMsg}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={saveCredentials}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          data-testid="notion-save"
        >
          Save credentials
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={runSync}
          className="bg-secondary text-secondary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          data-testid="notion-sync-now"
        >
          Sync tasks now
        </button>
      </div>
    </section>
  );
}
