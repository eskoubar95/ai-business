"use client";

import { useState } from "react";

import type { GrillQuickReply } from "@/lib/grill-me/extract-quick-replies";

import { cn } from "@/lib/utils";

export function InputForm({
  disabled,
  onSend,
  embedded = false,
  quickReplies = [],
  placeholder = embedded ? "Type a reply or tap an option below…" : "Describe your business…",
}: {
  disabled: boolean;
  onSend: (text: string) => void;
  embedded?: boolean;
  quickReplies?: GrillQuickReply[];
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = value.trim();
    if (!t || disabled) return;
    setValue("");
    onSend(t);
  }

  function pickReply(r: GrillQuickReply) {
    if (disabled) return;
    setValue("");
    onSend(r.value);
  }

  if (embedded) {
    return (
      <div className="flex flex-col gap-2 border-t border-border/50 bg-black/30 px-3 py-3 dark:bg-black/20">
        {quickReplies.length > 0 ? (
          <div className="flex flex-wrap gap-2 pb-1" role="group" aria-label="Quick replies">
            {quickReplies.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={disabled}
                onClick={() => pickReply(r)}
                className="border-border hover:border-primary/50 hover:bg-primary/10 max-w-[100%] rounded-full border px-3 py-1.5 text-left font-mono text-[11px] leading-snug transition-colors disabled:pointer-events-none disabled:opacity-40"
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                const el = document.getElementById("grill-me-chat-input-inline");
                el?.focus();
              }}
              className="text-muted-foreground hover:border-primary/40 hover:text-foreground border-border rounded-full border border-dashed px-3 py-1.5 text-[11px] transition-colors disabled:pointer-events-none disabled:opacity-40"
            >
              Other — write your own below
            </button>
          </div>
        ) : null}
        <form onSubmit={submit} className="flex gap-2">
          <textarea
            id="grill-me-chat-input-inline"
            data-testid="grill-me-chat-input"
            className={cn(
              "border-border bg-background/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex-1 resize-y rounded-xl border px-3 py-2.5 font-sans text-[13px] leading-relaxed shadow-inner outline-none focus-visible:ring-2 min-h-[44px]",
            )}
            rows={2}
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e as unknown as React.FormEvent);
              }
            }}
            placeholder={placeholder}
          />
          <button
            type="submit"
            data-testid="grill-me-send"
            disabled={disabled || !value.trim()}
            className="bg-primary text-primary-foreground hover:opacity-90 inline-flex shrink-0 self-end rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-opacity disabled:pointer-events-none disabled:opacity-35"
          >
            Send
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {quickReplies.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick replies">
          {quickReplies.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={disabled}
              onClick={() => pickReply(r)}
              className="border-border hover:border-primary/50 hover:bg-primary/10 rounded-full border px-3 py-1.5 text-left font-mono text-[11px] leading-snug transition-colors disabled:pointer-events-none disabled:opacity-40"
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              (
                document.querySelector(
                  "[data-testid=grill-me-chat-input]",
                ) as HTMLElement | null
              )?.focus()
            }
            className="text-muted-foreground hover:border-primary/40 hover:text-foreground border-border rounded-full border border-dashed px-3 py-1.5 text-[11px] transition-colors disabled:pointer-events-none disabled:opacity-40"
          >
            Other — type below
          </button>
        </div>
      ) : null}
      <textarea
        data-testid="grill-me-chat-input"
        className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring min-h-[96px] w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus-visible:ring-2"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="submit"
        data-testid="grill-me-send"
        disabled={disabled || !value.trim()}
        className="bg-foreground text-background hover:opacity-90 inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium shadow-sm transition-opacity disabled:pointer-events-none disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}
