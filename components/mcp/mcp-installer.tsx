"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { grantMcpAccessToAgent, saveMcpCredential } from "@/lib/mcp/actions";
import { listMcpTypeConfigs, type McpTypeConfig } from "@/lib/mcp/config";

type MetaRow = { id: string; mcpName: string };

type Props = {
  businessId: string;
  agentId: string;
  meta: MetaRow[];
};

function emptyPayload(config: McpTypeConfig): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of config.fields) {
    o[f.name] = "";
  }
  return o;
}

export function McpInstaller({ businessId, agentId, meta }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const configs = listMcpTypeConfigs();
  const [selectedId, setSelectedId] = useState<McpTypeConfig["id"]>("github");
  const selected = configs.find((c) => c.id === selectedId) ?? configs[0]!;
  const [fields, setFields] = useState<Record<string, string>>(() =>
    emptyPayload(selected),
  );

  function openModal() {
    setError(null);
    const cfg = configs.find((c) => c.id === selectedId) ?? configs[0]!;
    setFields(emptyPayload(cfg));
    setOpen(true);
  }

  function pickType(id: McpTypeConfig["id"]) {
    setSelectedId(id);
    const cfg = configs.find((c) => c.id === id)!;
    setFields(emptyPayload(cfg));
  }

  function submit() {
    setError(null);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      payload[k] = v;
    }
    startTransition(async () => {
      try {
        const { id: credId } = await saveMcpCredential(businessId, selected.id, payload);
        await grantMcpAccessToAgent(agentId, credId);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <section
      className="border-border mt-8 flex flex-col gap-4 rounded-lg border p-4"
      data-testid="mcp-installer"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">MCP credentials</h2>
        <button
          type="button"
          data-testid="mcp-install-open"
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm"
          onClick={openModal}
        >
          Install / update
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {meta.map((m) => (
          <li
            key={m.id}
            data-testid={`mcp-badge-${m.mcpName}`}
            className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
          >
            {m.mcpName}
          </li>
        ))}
        {meta.length === 0 ? (
          <li className="text-muted-foreground text-sm">No MCP integrations yet.</li>
        ) : null}
      </ul>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="mcp-install-modal"
        >
          <div className="bg-background border-border max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border p-4 shadow-lg">
            <h3 className="mb-3 text-base font-semibold">MCP type</h3>
            <div className="mb-4 flex gap-2">
              {configs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  data-testid={`mcp-type-${c.id}`}
                  className={`rounded-md border px-2 py-1 text-sm ${
                    c.id === selectedId ? "border-primary bg-primary/10" : "border-border"
                  }`}
                  onClick={() => pickType(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {selected.fields.map((f) => (
              <div key={f.name} className="mb-3 flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`mcp-${f.name}`}>
                  {f.label}
                </label>
                <input
                  id={`mcp-${f.name}`}
                  data-testid={`mcp-field-${f.name}`}
                  type={f.type === "password" ? "password" : "text"}
                  autoComplete="off"
                  className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                  value={fields[f.name] ?? ""}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, [f.name]: e.target.value }))
                  }
                />
              </div>
            ))}
            {error ? (
              <p className="text-destructive mb-2 text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="text-muted-foreground rounded-md px-3 py-1.5 text-sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="mcp-install-submit"
                disabled={pending}
                className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
                onClick={submit}
              >
                Save credential
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
