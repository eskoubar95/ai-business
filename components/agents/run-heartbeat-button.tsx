"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { runHeartbeat } from "@/lib/heartbeat/actions";

export function RunHeartbeatButton({ agentId }: { agentId: string }) {
  const [pending, startTransition] = useTransition();
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  function onRun() {
    setLastMessage(null);
    startTransition(async () => {
      const res = await runHeartbeat(agentId);
      if (res.success) {
        setLastMessage("Heartbeat finished.");
        toast.success("Heartbeat finished.");
      } else {
        setLastMessage(res.error);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {lastMessage && !pending ? (
        <p className="text-[11px] text-muted-foreground" role="status">
          {lastMessage}
        </p>
      ) : null}
      <Button
        type="button"
        data-testid="run-heartbeat"
        disabled={pending}
        variant="outline"
        size="sm"
        className="cursor-pointer gap-1.5"
        onClick={onRun}
      >
        {pending ? "Running…" : "Run Heartbeat"}
      </Button>
    </div>
  );
}
