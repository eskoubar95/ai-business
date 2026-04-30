"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { approveArtifact, rejectArtifact } from "@/lib/approvals/actions";
import { LoadingButton } from "@/components/ui/loading-button";
import type { PendingApprovalCard } from "@/lib/dashboard/home-data";

export function PendingApprovalsQueueClient({ items }: { items: PendingApprovalCard[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(kind: "approve" | "reject", id: string) {
    startTransition(async () => {
      try {
        if (kind === "approve") {
          await approveArtifact(id, "");
          toast.success("Approved");
        } else {
          await rejectArtifact(id, "");
          toast.success("Rejected");
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        All set — no pending approvals for your workspaces.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((a) => (
        <li
          key={a.id}
          className="border-border bg-card flex flex-col gap-2 rounded-lg border p-3 text-sm"
        >
          <div className="text-foreground line-clamp-2 font-medium">{a.artifactLabel}</div>
          <div className="text-muted-foreground text-xs">
            {a.businessName}
            {a.agentName ? ` · ${a.agentName}` : ""}
          </div>
          <div className="flex flex-wrap gap-2">
            <LoadingButton
              type="button"
              size="sm"
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-600/90"
              loading={pending}
              onClick={() => act("approve", a.id)}
            >
              Approve
            </LoadingButton>
            <LoadingButton
              type="button"
              size="sm"
              variant="destructive"
              className="cursor-pointer"
              loading={pending}
              onClick={() => act("reject", a.id)}
            >
              Reject
            </LoadingButton>
          </div>
        </li>
      ))}
    </ul>
  );
}
