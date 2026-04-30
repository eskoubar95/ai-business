"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { appendTaskLog } from "@/lib/tasks/log-actions";

export function TaskCommentInput({
  taskId,
  currentUserId,
}: {
  taskId: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const content = text.trim();
    if (!content) {
      toast.error("Write a comment first.");
      return;
    }

    startTransition(async () => {
      try {
        await appendTaskLog(taskId, content, "human", currentUserId);
        setText("");
        toast.success("Comment added.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add comment");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2" data-testid="task-comment-input">
      <label className="text-sm font-medium" htmlFor="task-comment-body">
        Add comment
      </label>
      <p className="text-muted-foreground text-xs">
        Use <code className="bg-muted rounded px-1 py-0.5">@AgentName</code> to trigger orchestration for
        that agent.
      </p>
      <textarea
        id="task-comment-body"
        data-testid="task-comment-body"
        className="border-border bg-background min-h-[100px] rounded-md border px-3 py-2 text-sm"
        value={text}
        disabled={pending}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment…"
      />
      <div>
        <Button type="button" disabled={pending} data-testid="task-comment-submit" onClick={submit}>
          {pending ? "Sending…" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
