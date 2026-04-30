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
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        data-testid="run-heartbeat"
        disabled={pending}
        variant="secondary"
        onClick={onRun}
      >
        {pending ? "Running heartbeat…" : "Run Heartbeat"}
      </Button>
      {lastMessage && !pending ? (
        <p className="text-muted-foreground text-sm" role="status">
          {lastMessage}
        </p>
      ) : null}
    </div>
  );
}
