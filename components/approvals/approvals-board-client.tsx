"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useOptimistic, useTransition } from "react";

import { approveArtifact, rejectArtifact } from "@/lib/approvals/actions";
import { summarizeArtifactRef } from "@/lib/approvals/artifact-summary";
import type { SerializableApprovalCard } from "@/lib/approvals/queries";
import { cn } from "@/lib/utils";

type Grouped = {
  pending: SerializableApprovalCard[];
  approved: SerializableApprovalCard[];
  rejected: SerializableApprovalCard[];
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40">
        {label}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground/25 tabular-nums">
        {count}
      </span>
    </div>
  );
}

function PendingApprovalRow({
  item,
  businessId,
}: {
  item: SerializableApprovalCard;
  businessId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [visible, setVisibleOptimistic] = useOptimistic(true, (_, next: boolean) => next);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState("");

  if (!visible) return null;

  function doApprove() {
    startTransition(async () => {
      setVisibleOptimistic(false);
      try {
        await approveArtifact(item.id, "");
        router.refresh();
      } catch {
        setVisibleOptimistic(true);
      }
    });
  }

  function doReject() {
    startTransition(async () => {
      setVisibleOptimistic(false);
      try {
        await rejectArtifact(item.id, comment);
        router.refresh();
      } catch {
        setVisibleOptimistic(true);
      }
    });
  }

  return (
    <div
      data-testid={`approval-card-${item.id}`}
      className="group border-b border-white/[0.05] last:border-0"
    >
      {/* Main row */}
      <div className="flex items-center gap-3 py-3 px-4">
        <span className="size-1.5 shrink-0 rounded-full bg-amber-400 mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground/90 truncate">
              {summarizeArtifactRef(item.artifactRef)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {item.agentName && (
              <span className="font-mono text-[10.5px] text-muted-foreground/50">
                {item.agentName}
              </span>
            )}
            <span className="font-mono text-[10.5px] text-muted-foreground/35">
              {formatRelativeTime(item.createdAt)}
            </span>
            <a
              href={`/dashboard/approvals/${item.id}?businessId=${encodeURIComponent(businessId)}`}
              className="font-mono text-[10px] text-primary/60 hover:text-primary transition-colors"
              data-testid={`approval-detail-link-${item.id}`}
            >
              details →
            </a>
          </div>
        </div>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            type="button"
            disabled={pending}
            data-testid={`approval-approve-${item.id}`}
            onClick={doApprove}
            className="flex h-7 items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            <Check className="size-3" /> Approve
          </button>
          <button
            type="button"
            disabled={pending}
            data-testid={`approval-reject-${item.id}`}
            onClick={() => setRejectOpen((r) => !r)}
            className={cn(
              "flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-medium transition-colors disabled:opacity-50",
              rejectOpen
                ? "border-destructive/40 bg-destructive/15 text-destructive"
                : "border-white/[0.10] bg-white/[0.04] text-muted-foreground/60 hover:border-destructive/30 hover:text-destructive/80",
            )}
          >
            <X className="size-3" /> Reject
          </button>
        </div>
      </div>

      {/* Inline reject form — animated expand/collapse */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          rejectOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-3 ml-5 flex gap-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              data-testid={`approval-comment-${item.id}`}
              rows={2}
              className="flex-1 rounded-md border border-border bg-white/[0.04] px-3 py-2 text-[12.5px] text-foreground/80 placeholder:text-muted-foreground/30 focus:border-destructive/40 focus:outline-none resize-none"
            />
            <button
              type="button"
              onClick={doReject}
              disabled={pending}
              className="self-end flex h-8 items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 text-[12px] font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 shrink-0"
            >
              Confirm reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryApprovalRow({
  item,
  status,
  businessId,
}: {
  item: SerializableApprovalCard;
  status: "approved" | "rejected";
  businessId: string;
}) {
  return (
    <div
      data-testid={`approval-settled-${item.id}`}
      className="flex items-center gap-3 py-2.5 px-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full mt-0.5",
          status === "approved" ? "bg-emerald-500" : "bg-destructive",
        )}
      />
      <div className="flex-1 min-w-0">
        <span className="text-[12.5px] text-foreground/70 truncate block">
          {summarizeArtifactRef(item.artifactRef)}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          {item.agentName && (
            <span className="font-mono text-[10px] text-muted-foreground/40">
              {item.agentName}
            </span>
          )}
          <span className="font-mono text-[10px] text-muted-foreground/30">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
      </div>
      <span
        className={cn(
          "font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border",
          status === "approved"
            ? "text-emerald-400/70 bg-emerald-500/10 border-emerald-500/20"
            : "text-destructive/60 bg-destructive/10 border-destructive/20",
        )}
      >
        {status}
      </span>
    </div>
  );
}

export function ApprovalsBoardClient({
  businessId,
  grouped,
}: {
  businessId: string;
  grouped: Grouped;
}) {
  const historyItems = [
    ...grouped.approved.map((i) => ({ ...i, status: "approved" as const })),
    ...grouped.rejected.map((i) => ({ ...i, status: "rejected" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isEmpty =
    grouped.pending.length === 0 &&
    grouped.approved.length === 0 &&
    grouped.rejected.length === 0;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Pending section */}
      {grouped.pending.length > 0 && (
        <div>
          <SectionHeader label="Pending" count={grouped.pending.length} />
          <div
            data-testid="approvals-column-pending"
            className="rounded-md border border-border bg-background overflow-hidden"
          >
            {grouped.pending.map((item) => (
              <PendingApprovalRow key={item.id} item={item} businessId={businessId} />
            ))}
          </div>
        </div>
      )}

      {/* History section */}
      {historyItems.length > 0 && (
        <div>
          <SectionHeader label="History" count={historyItems.length} />
          <div
            data-testid="approvals-board"
            className="rounded-md border border-border bg-background overflow-hidden"
          >
            {historyItems.map((item) => (
              <HistoryApprovalRow
                key={item.id}
                item={item}
                status={item.status}
                businessId={businessId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div
          data-testid="approvals-empty"
          className="flex flex-col items-center justify-center py-16 text-center animate-fade-in"
        >
          <p className="text-[13px] font-medium text-foreground/50">
            Nothing in approvals yet
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground/35">
            When agents pause for a human gate, items appear here.
          </p>
        </div>
      )}
    </div>
  );
}
