"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { McpLibraryBoard } from "@/lib/mcp/actions";
import {
  deleteMcpCredential,
  grantMcpAccessToAgent,
  revokeMcpAccessFromAgent,
  saveMcpCredential,
} from "@/lib/mcp/actions";
import { listMcpTypeConfigs, type McpTypeConfig } from "@/lib/mcp/config";

type Props = {
  businessId: string;
  board: McpLibraryBoard;
  onChanged: () => Promise<void>;
};

function emptyPayload(config: McpTypeConfig): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of config.fields) {
    o[f.name] = "";
  }
  return o;
}

export function McpLibrary({ businessId, board, onChanged }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const configs = listMcpTypeConfigs();
  const [selectedId, setSelectedId] = useState<McpTypeConfig["id"]>("github");
  const selected = configs.find((c) => c.id === selectedId) ?? configs[0]!;
  const [fields, setFields] = useState<Record<string, string>>(() => emptyPayload(selected));

  const accessSet = useMemo(() => {
    const s = new Set<string>();
    for (const l of board.accessLinks) {
      s.add(`${l.agentId}:${l.mcpCredentialId}`);
    }
    return s;
  }, [board.accessLinks]);

  function hasAccess(agentId: string, credId: string) {
    return accessSet.has(`${agentId}:${credId}`);
  }

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

  function submitNewCredential() {
    setError(null);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      payload[k] = v;
    }
    startTransition(async () => {
      try {
        await saveMcpCredential(businessId, selected.id, payload);
        setOpen(false);
        toast.success("Credential saved at business level.");
        await onChanged();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function toggleAccess(agentId: string, credId: string, next: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        if (next) await grantMcpAccessToAgent(agentId, credId);
        else await revokeMcpAccessFromAgent(agentId, credId);
        await onChanged();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Access update failed");
      }
    });
  }

  function removeCredential(credId: string, label: string) {
    if (!window.confirm(`Remove MCP credential “${label}” for this business?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteMcpCredential(credId);
        toast.success("Credential removed.");
        await onChanged();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <section
      className="border-border flex flex-col gap-4 rounded-lg border p-4"
      data-testid="mcp-library"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">MCP library</h2>
          <p className="text-muted-foreground text-xs">
            Credentials are stored per business. Toggle which agents may use each integration.
          </p>
        </div>
        <Button type="button" size="sm" data-testid="mcp-library-add" onClick={openModal}>
          Add credential
        </Button>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {board.credentials.length === 0 ? (
        <p className="text-muted-foreground text-sm">No MCP credentials yet for this business.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {board.credentials.map((c) => (
            <li
              key={c.id}
              className="bg-muted/40 rounded-lg border border-transparent px-3 py-3"
              data-testid={`mcp-library-row-${c.mcpName}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium capitalize">{c.mcpName}</p>
                  <p className="text-muted-foreground text-xs">
                    Added {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-destructive hover:underline disabled:opacity-50 text-xs"
                  disabled={pending}
                  data-testid={`mcp-library-delete-${c.id}`}
                  onClick={() => removeCredential(c.id, c.mcpName)}
                >
                  Remove
                </button>
              </div>
              {board.agents.length === 0 ? (
                <p className="text-muted-foreground mt-2 text-xs">No agents to grant.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {board.agents.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={hasAccess(a.id, c.id)}
                        disabled={pending}
                        data-testid={`mcp-access-${c.id}-${a.id}`}
                        onChange={(e) => toggleAccess(a.id, c.id, e.target.checked)}
                      />
                      <span>{a.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="mcp-library-modal"
        >
          <div className="bg-background border-border max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border p-4 shadow-lg">
            <h3 className="mb-3 text-base font-semibold">MCP type</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {configs.map((cfg) => (
                <button
                  key={cfg.id}
                  type="button"
                  data-testid={`mcp-library-type-${cfg.id}`}
                  className={`rounded-md border px-2 py-1 text-sm ${
                    cfg.id === selectedId ? "border-primary bg-primary/10" : "border-border"
                  }`}
                  onClick={() => pickType(cfg.id)}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            {selected.fields.map((f) => (
              <div key={f.name} className="mb-3 flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor={`mcp-lib-${f.name}`}>
                  {f.label}
                </label>
                <input
                  id={`mcp-lib-${f.name}`}
                  data-testid={`mcp-library-field-${f.name}`}
                  type={f.type === "password" ? "password" : "text"}
                  autoComplete="off"
                  className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                  value={fields[f.name] ?? ""}
                  onChange={(e) => setFields((prev) => ({ ...prev, [f.name]: e.target.value }))}
                />
              </div>
            ))}
            {error ? (
              <p className="text-destructive mb-2 text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={pending}
                data-testid="mcp-library-submit"
                onClick={submitNewCredential}
              >
                Save credential
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
