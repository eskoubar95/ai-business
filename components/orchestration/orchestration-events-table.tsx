"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { orchestrationEvents } from "@/db/schema";
import { retriggerOrchestrationEvent } from "@/lib/orchestration/event-actions";
import { cn } from "@/lib/utils";

type Row = typeof orchestrationEvents.$inferSelect;

export function OrchestrationEventsTable({ rows }: { rows: Row[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  function retrigger(id: string) {
    setPendingId(id);
    start(async () => {
      try {
        const res = await retriggerOrchestrationEvent(id);
        if (res.ok) {
          toast.success("Event re-queued.");
          window.location.reload();
        } else {
          toast.error(res.error);
        }
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/30 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
            <th className="px-4 py-2 font-normal">Status</th>
            <th className="px-4 py-2 font-normal">Type</th>
            <th className="px-4 py-2 font-normal">Details</th>
            <th className="px-4 py-2 font-normal">Updated</th>
            <th className="px-4 py-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pending = pendingId === r.id;
            const payload = payloadPreview(r.payload);
            const err = extractError(r.payload);
            return (
              <tr key={r.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                <td className="align-top px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 font-mono text-[10px]", statusClass(r.status))}>
                    {r.status}
                  </span>
                </td>
                <td className="align-top px-4 py-3 font-mono text-[11px] text-muted-foreground">{r.type}</td>
                <td className="max-w-md align-top px-4 py-3">
                  <p className="break-all font-mono text-[10px] text-muted-foreground/40">{r.id}</p>
                  {err && (
                    <p className="mt-1 text-[11px] text-destructive/80">{err}</p>
                  )}
                  <pre className="mt-2 max-h-24 overflow-auto rounded bg-black/20 p-2 text-[10px] text-muted-foreground/70">
                    {payload}
                  </pre>
                </td>
                <td className="align-top whitespace-nowrap px-4 py-3 text-[11px] text-muted-foreground/55">
                  {new Date(r.updatedAt).toLocaleString()}
                </td>
                <td className="align-top px-4 py-3 text-right">
                  {r.status === "failed" && (
                    <button
                      type="button"
                      disabled={pending}
                      className={cn(
                        "cursor-pointer rounded border border-primary/40 px-3 py-1 text-[11px] font-medium text-primary",
                        pending && "cursor-not-allowed opacity-50",
                      )}
                      onClick={() => retrigger(r.id)}
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function statusClass(s: Row["status"]) {
  switch (s) {
    case "pending":
      return "border border-amber-400/20 bg-amber-400/15 text-amber-400";
    case "processing":
      return "border border-sky-500/20 bg-sky-500/15 text-sky-400";
    case "succeeded":
      return "border border-success/30 bg-success/15 text-success";
    case "failed":
      return "border border-destructive/30 bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function payloadPreview(p: unknown): string {
  try {
    const s = JSON.stringify(p);
    return s.length > 400 ? `${s.slice(0, 400)}…` : s;
  } catch {
    return "(unserializable payload)";
  }
}

function extractError(p: unknown): string | undefined {
  if (!p || typeof p !== "object") return undefined;
  const o = p as Record<string, unknown>;
  return typeof o.runnerError === "string" ? o.runnerError : undefined;
}
