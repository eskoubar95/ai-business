"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AgentOnboardingHint({
  businessId,
  agentId,
}: {
  businessId: string;
  agentId: string;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  if (sp.get("onboarding") !== "1") {
    return null;
  }

  function dismiss() {
    router.replace(`/dashboard/agents/${agentId}?businessId=${encodeURIComponent(businessId)}`);
  }

  return (
    <div className="border-border bg-accent/30 mb-6 flex gap-3 rounded-lg border p-4 text-sm">
      <div className="min-w-0 flex-1">
        <p className="text-foreground font-medium">Agent created.</p>
        <p className="text-muted-foreground mt-1">
          Next: add instructions, attach skills, configure MCP, then run heartbeat from the header.
          Use the tabs below to move through each area.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="cursor-pointer shrink-0"
        aria-label="Dismiss"
        onClick={dismiss}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
