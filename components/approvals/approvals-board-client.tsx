"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { ApprovalCard } from "@/components/approvals/approval-card";
import { RightPanel } from "@/components/ui/right-panel";
import { summarizeArtifactRef } from "@/lib/approvals/artifact-summary";
import type { SerializableApprovalCard } from "@/lib/approvals/queries";
import { cn } from "@/lib/utils";

type Grouped = {
  pending: SerializableApprovalCard[];
  approved: SerializableApprovalCard[];
  rejected: SerializableApprovalCard[];
};

export function ApprovalsBoardClient({
  businessId,
  grouped,
}: {
  businessId: string;
  grouped: Grouped;
}) {
  const [selected, setSelected] = useState<{
    item: SerializableApprovalCard;
    column: "approved" | "rejected";
  } | null>(null);

  return (
    <>
      <section
        data-testid="approvals-board"
        className="mt-6 grid gap-4 lg:grid-cols-3"
      >
        <ApprovalsColumn
          title="Pending"
          testId="approvals-column-pending"
          items={grouped.pending}
          renderItem={(item) => (
            <li key={item.id}>
              <ApprovalCard approval={item} businessId={businessId} />
            </li>
          )}
          emptyHint="Nothing waiting for approval."
        />
        <ApprovalsColumn
          title="Approved"
          testId="approvals-column-approved"
          items={grouped.approved}
          renderItem={(item) => (
            <li key={item.id}>
              <SettledApprovalCard
                item={item}
                businessId={businessId}
                variant="approved"
                onOpen={() => setSelected({ item, column: "approved" })}
              />
            </li>
          )}
          emptyHint="No approved items yet."
        />
        <ApprovalsColumn
          title="Rejected"
          testId="approvals-column-rejected"
          items={grouped.rejected}
          renderItem={(item) => (
            <li key={item.id}>
              <SettledApprovalCard
                item={item}
                businessId={businessId}
                variant="rejected"
                onOpen={() => setSelected({ item, column: "rejected" })}
              />
            </li>
          )}
          emptyHint="No rejected items."
        />
      </section>

      <RightPanel
        open={Boolean(selected)}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
        title={
          selected
            ? summarizeArtifactRef(selected.item.artifactRef)
            : "Approval"
        }
      >
        {selected ? (
          <div className="flex flex-col gap-4 text-sm">
            <p className="text-muted-foreground text-xs">
              {new Date(selected.item.createdAt).toLocaleString()}
            </p>
            <p className="text-muted-foreground">
              Agent:{" "}
              <span className="text-foreground font-medium">
                {selected.item.agentName ?? selected.item.agentId ?? "—"}
              </span>
            </p>
            <span
              className={cn(
                "w-fit rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                selected.column === "approved"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {selected.column}
            </span>
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide">
                Artifact reference
              </h3>
              <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
                {JSON.stringify(selected.item.artifactRef, null, 2)}
              </pre>
            </div>
            <Link
              href={`/dashboard/approvals/${selected.item.id}?businessId=${encodeURIComponent(businessId)}`}
              className="text-primary text-sm underline"
            >
              Open full history
            </Link>
          </div>
        ) : null}
      </RightPanel>
    </>
  );
}

function ApprovalsColumn<T>({
  title,
  testId,
  items,
  renderItem,
  emptyHint,
}: {
  title: string;
  testId: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyHint: string;
}) {
  return (
    <div
      data-testid={testId}
      className="border-border bg-card flex min-h-[200px] flex-col rounded-lg border"
    >
      <div className="border-border flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {items.length}
        </span>
      </div>
      <ul className="flex flex-col gap-3 p-3">
        {items.length === 0 ? (
          <li className="text-muted-foreground text-sm">{emptyHint}</li>
        ) : (
          items.map((item) => renderItem(item))
        )}
      </ul>
    </div>
  );
}

function SettledApprovalCard({
  item,
  businessId,
  variant,
  onOpen,
}: {
  item: SerializableApprovalCard;
  businessId: string;
  variant: "approved" | "rejected";
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={`approval-settled-${item.id}`}
      className={cn(
        "border-border bg-background hover:border-primary/40 w-full cursor-pointer rounded-lg border p-3 text-left text-sm transition-colors",
        variant === "approved" && "border-emerald-500/20",
        variant === "rejected" && "border-destructive/25",
      )}
      onClick={onOpen}
    >
      <span className="text-foreground block font-medium leading-snug">
        {summarizeArtifactRef(item.artifactRef)}
      </span>
      <span className="text-muted-foreground mt-1 block text-xs">
        {new Date(item.createdAt).toLocaleString()}
        {item.agentName ? ` · ${item.agentName}` : null}
      </span>
      <Link
        href={`/dashboard/approvals/${item.id}?businessId=${encodeURIComponent(businessId)}`}
        className="text-primary mt-2 inline-block text-xs underline"
        onClick={(e) => e.stopPropagation()}
      >
        Details
      </Link>
    </button>
  );
}
