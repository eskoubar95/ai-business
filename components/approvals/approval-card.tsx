"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { approveArtifact, rejectArtifact } from "@/lib/approvals/actions";

export type SerializablePendingApproval = {
  id: string;
  artifactRef: Record<string, unknown>;
  createdAt: string;
  agentId: string | null;
  agentName: string | null;
};

function summarizeRef(ref: Record<string, unknown>): string {
  const title = ref.title;
  if (typeof title === "string" && title.trim()) return title.trim();
  const keys = Object.keys(ref);
  if (keys.length === 0) return "(no reference)";
  return keys.slice(0, 3).join(", ") + (keys.length > 3 ? "…" : "");
}

export function ApprovalCard(props: {
  approval: SerializablePendingApproval;
  businessId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [visible, setVisibleOptimistic] = useOptimistic(true, (_, next: boolean) => next);

  const { approval: a } = props;

  if (!visible) {
    return null;
  }

  function run(action: "approve" | "reject", formData: FormData) {
    const comment = String(formData.get("comment") ?? "");
    startTransition(async () => {
      setVisibleOptimistic(false);
      try {
        if (action === "approve") {
          await approveArtifact(a.id, comment);
        } else {
          await rejectArtifact(a.id, comment);
        }
        router.refresh();
      } catch {
        setVisibleOptimistic(true);
      }
    });
  }

  return (
    <article
      className="border-border flex flex-col gap-3 rounded-lg border p-4"
      data-testid={`approval-card-${a.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-xs">
            {new Date(a.createdAt).toLocaleString()}
          </p>
          <p className="font-medium">{summarizeRef(a.artifactRef)}</p>
          {a.agentName ? (
            <p className="text-muted-foreground text-sm">Agent: {a.agentName}</p>
          ) : null}
        </div>
        <LinkToDetail approvalId={a.id} businessId={props.businessId} />
      </div>
      <form className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor={`comment-${a.id}`}>
          Comment
        </label>
        <textarea
          id={`comment-${a.id}`}
          name="comment"
          rows={3}
          className="border-input bg-background ring-offset-background rounded-md border px-3 py-2 text-sm"
          placeholder="Optional note for audit"
          data-testid={`approval-comment-${a.id}`}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={pending}
            data-testid={`approval-approve-${a.id}`}
            formAction={(fd) => run("approve", fd)}
          >
            Approve
          </Button>
          <Button
            type="submit"
            size="sm"
            variant="destructive"
            disabled={pending}
            data-testid={`approval-reject-${a.id}`}
            formAction={(fd) => run("reject", fd)}
          >
            Reject
          </Button>
        </div>
      </form>
    </article>
  );
}

function LinkToDetail(props: { approvalId: string; businessId: string }) {
  const href = `/dashboard/approvals/${props.approvalId}?businessId=${encodeURIComponent(props.businessId)}`;
  return (
    <Link href={href} className="text-primary text-sm underline">
      Details
    </Link>
  );
}
