"use client";

import type { CommunicationEdgeRow } from "@/lib/communication/edge-store";
import { deleteEdge } from "@/lib/communication/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type EdgeListProps = {
  businessId: string;
  edges: CommunicationEdgeRow[];
  onEdit: (edge: CommunicationEdgeRow) => void;
};

export function EdgeList({ businessId, edges, onEdit }: EdgeListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (edges.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="communication-edge-empty">
        No communication edges yet. Create one above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="communication-edge-list">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="py-2 pr-3 font-medium">From</th>
            <th className="py-2 pr-3 font-medium">To</th>
            <th className="py-2 pr-3 font-medium">Direction</th>
            <th className="py-2 pr-3 font-medium">Intents</th>
            <th className="py-2 pr-3 font-medium">Artifacts</th>
            <th className="py-2 pr-3 font-medium">Quota</th>
            <th className="py-2 pr-3 font-medium">Policy</th>
            <th className="py-2 pr-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {edges.map((edge) => (
            <tr
              key={edge.id}
              className="border-border/80 border-b"
              data-testid={`communication-edge-row-${edge.id}`}
            >
              <td className="py-2 pr-3 font-mono text-xs">{edge.fromRole}</td>
              <td className="py-2 pr-3 font-mono text-xs">{edge.toRole}</td>
              <td className="py-2 pr-3 text-xs">{edge.direction}</td>
              <td className="max-w-[180px] py-2 pr-3 text-xs break-words">
                {edge.allowedIntents.join(", ")}
              </td>
              <td className="max-w-[180px] py-2 pr-3 text-xs break-words">
                {edge.allowedArtifacts.join(", ")}
              </td>
              <td className="py-2 pr-3 text-xs">
                {edge.quotaPerHour ?? "—"}
                <span className="text-muted-foreground"> /h </span>
                <span className="text-muted-foreground">({edge.quotaMode})</span>
              </td>
              <td className="py-2 pr-3">
                {edge.requiresHumanAck ? (
                  <span
                    data-testid={`edge-violation-badge-${edge.id}`}
                    className={cn(
                      "inline-flex rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5",
                      "text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400",
                    )}
                  >
                    ACK required
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
              <td className="py-2 pr-0 text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    data-testid={`communication-edge-edit-${edge.id}`}
                    disabled={pending}
                    onClick={() => onEdit(edge)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    data-testid={`communication-edge-delete-${edge.id}`}
                    disabled={pending}
                    onClick={() => {
                      setDeletingId(edge.id);
                      startTransition(async () => {
                        try {
                          await deleteEdge(businessId, edge.id);
                          router.refresh();
                        } finally {
                          setDeletingId(null);
                        }
                      });
                    }}
                  >
                    {deletingId === edge.id && pending ? "…" : "Delete"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
