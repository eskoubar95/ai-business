"use client";

import type { CommunicationEdgeRow } from "@/lib/communication/edge-store";
import { createEdge, updateEdge } from "@/lib/communication/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

function parseList(raw: string): string[] {
  return raw
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type EdgeFormProps = {
  businessId: string;
  editingEdge: CommunicationEdgeRow | null;
  onCancelEdit: () => void;
};

export function EdgeForm({ businessId, editingEdge, onCancelEdit }: EdgeFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fromRole, setFromRole] = useState("");
  const [toRole, setToRole] = useState("");
  const [direction, setDirection] = useState<"one_way" | "bidirectional">("one_way");
  const [allowedIntents, setAllowedIntents] = useState("");
  const [allowedArtifacts, setAllowedArtifacts] = useState("");
  const [requiresHumanAck, setRequiresHumanAck] = useState(false);
  const [quotaPerHour, setQuotaPerHour] = useState("");

  useEffect(() => {
    if (editingEdge) {
      setFromRole(editingEdge.fromRole);
      setToRole(editingEdge.toRole);
      setDirection(editingEdge.direction);
      setAllowedIntents(editingEdge.allowedIntents.join(", "));
      setAllowedArtifacts(editingEdge.allowedArtifacts.join(", "));
      setRequiresHumanAck(editingEdge.requiresHumanAck);
      setQuotaPerHour(editingEdge.quotaPerHour != null ? String(editingEdge.quotaPerHour) : "");
    } else {
      setFromRole("");
      setToRole("");
      setDirection("one_way");
      setAllowedIntents("");
      setAllowedArtifacts("");
      setRequiresHumanAck(false);
      setQuotaPerHour("");
    }
  }, [editingEdge]);

  const submit = useCallback(() => {
    setError(null);
    if (!editingEdge) {
      if (!fromRole.trim()) {
        setError("From role is required");
        return;
      }
      if (!toRole.trim()) {
        setError("To role is required");
        return;
      }
    }
    const quota =
      quotaPerHour.trim() === "" ? null : Number.parseInt(quotaPerHour, 10);
    if (quotaPerHour.trim() !== "" && (Number.isNaN(quota!) || quota! < 1)) {
      setError("quota_per_hour must be a positive integer or empty");
      return;
    }

    const intentsList = parseList(allowedIntents);
    if (intentsList.length === 0) {
      setError("At least one allowed intent is required");
      return;
    }

    startTransition(async () => {
      try {
        if (editingEdge) {
          await updateEdge(businessId, editingEdge.id, {
            direction,
            allowedIntents: intentsList,
            allowedArtifacts: parseList(allowedArtifacts),
            requiresHumanAck,
            quotaPerHour: quota,
            quotaMode: editingEdge.quotaMode,
          });
          onCancelEdit();
        } else {
          await createEdge(businessId, {
            fromRole: fromRole.trim(),
            toRole: toRole.trim(),
            direction,
            allowedIntents: intentsList,
            allowedArtifacts: parseList(allowedArtifacts),
            requiresHumanAck,
            quotaPerHour: quota,
            quotaMode: "warn_only",
          });
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }, [
    allowedArtifacts,
    allowedIntents,
    businessId,
    direction,
    editingEdge,
    fromRole,
    onCancelEdit,
    quotaPerHour,
    requiresHumanAck,
    router,
    toRole,
  ]);

  const inputClass = cn(
    "border-input bg-background ring-offset-background placeholder:text-muted-foreground",
    "flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none",
    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
  );

  return (
    <div
      className="border-border bg-card/40 mb-8 rounded-lg border p-4"
      data-testid="communication-edge-form"
    >
      <h2 className="text-foreground mb-3 text-sm font-medium">
        {editingEdge ? "Edit edge" : "Create edge"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          From role
          <input
            className={inputClass}
            data-testid="communication-edge-from"
            disabled={!!editingEdge || pending}
            value={fromRole}
            onChange={(e) => setFromRole(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          To role
          <input
            className={inputClass}
            data-testid="communication-edge-to"
            disabled={!!editingEdge || pending}
            value={toRole}
            onChange={(e) => setToRole(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2">
          Direction
          <select
            className={inputClass}
            data-testid="communication-edge-direction"
            disabled={pending}
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value as "one_way" | "bidirectional")
            }
          >
            <option value="one_way">one_way</option>
            <option value="bidirectional">bidirectional</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2">
          Allowed intents (comma-separated)
          <input
            className={inputClass}
            data-testid="communication-edge-intents"
            disabled={pending}
            value={allowedIntents}
            onChange={(e) => setAllowedIntents(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2">
          Allowed artifacts (comma-separated)
          <input
            className={inputClass}
            data-testid="communication-edge-artifacts"
            disabled={pending}
            value={allowedArtifacts}
            onChange={(e) => setAllowedArtifacts(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Quota / hour (optional)
          <input
            className={inputClass}
            data-testid="communication-edge-quota"
            disabled={pending}
            value={quotaPerHour}
            onChange={(e) => setQuotaPerHour(e.target.value)}
          />
        </label>
        <label className="text-muted-foreground flex items-center gap-2 text-xs sm:mt-5">
          <input
            type="checkbox"
            data-testid="communication-edge-ack"
            disabled={pending}
            checked={requiresHumanAck}
            onChange={(e) => setRequiresHumanAck(e.target.checked)}
          />
          Requires human acknowledgement
        </label>
      </div>
      {error ? (
        <p className="text-destructive mt-2 text-sm" data-testid="communication-edge-error">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          data-testid="communication-edge-submit"
          onClick={() => void submit()}
        >
          {editingEdge ? "Save changes" : "Create edge"}
        </Button>
        {editingEdge ? (
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onCancelEdit}>
            Cancel edit
          </Button>
        ) : null}
      </div>
    </div>
  );
}
