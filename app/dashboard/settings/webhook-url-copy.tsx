"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

export function WebhookUrlCopy({ url }: { url: string }) {
  function copyToClipboard() {
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Webhook URL copied.");
    });
  }

  return (
    <div
      className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.03] px-3 py-2.5"
      data-testid="settings-webhook-endpoint"
    >
      <span className="flex-1 truncate font-mono text-[11.5px] text-foreground/60">{url}</span>
      <button
        onClick={copyToClipboard}
        className="shrink-0 text-muted-foreground/40 hover:text-foreground/70 transition-colors"
        title="Copy URL"
      >
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}
