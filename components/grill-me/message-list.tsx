"use client";

import { useEffect, useRef } from "react";

import type { UIMessage } from "ai";
import Markdown from "react-markdown";

import { cn } from "@/lib/utils";

export function messagePlainText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function assistantIsWorking(messages: UIMessage[]): boolean {
  if (messages.length === 0) return true;
  const last = messages[messages.length - 1];
  if (last.role === "user") return true;
  if (last.role === "assistant") return messagePlainText(last).trim() === "";
  return false;
}

function ThinkingDots() {
  return (
    <div
      className="flex items-center gap-3 py-1"
      data-testid="grill-me-thinking"
      aria-busy="true"
      aria-label="Assistant is thinking"
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
        <span className="relative inline-flex size-2 rounded-full bg-primary/70" />
      </span>
      <span className="flex gap-[5px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-[5px] rounded-full bg-muted-foreground/30 animate-bounce"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </span>
    </div>
  );
}

function AssistantBubbleBody({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <>
      <div className="prose prose-sm prose-invert max-w-none leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:text-foreground/90 [&_code]:rounded [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[11px]">
        <Markdown>{trimmed}</Markdown>
      </div>
      {streaming ? (
        <span className="text-primary/60 animate-pulse font-mono text-xs" aria-hidden>
          ▍
        </span>
      ) : null}
    </>
  );
}

export function MessageList({
  messages,
  className,
  embedded = false,
  assistantBusy = false,
}: {
  messages: UIMessage[];
  className?: string;
  embedded?: boolean;
  assistantBusy?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const showThinking = assistantBusy && assistantIsWorking(messages);
  const lastId = messages.length ? messages[messages.length - 1].id : null;
  const lastIsAssistantStreaming =
    assistantBusy &&
    !!lastId &&
    messages[messages.length - 1]?.role === "assistant" &&
    messagePlainText(messages[messages.length - 1]).trim() !== "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, showThinking]);

  const visibleMessages = messages.filter((m) => {
    if (m.role === "assistant" && messagePlainText(m).trim() === "" && showThinking) {
      return false;
    }
    return true;
  });

  return (
    <div
      ref={containerRef}
      data-testid="grill-me-message-list"
      className={cn(
        "flex flex-col overflow-y-auto scroll-smooth",
        embedded
          ? "flex-1 min-h-0 px-4 py-4 gap-4"
          : "gap-4 px-2 py-4",
        className,
      )}
    >
      {visibleMessages.length === 0 && !showThinking ? (
        <div className="flex flex-1 items-center justify-center py-8">
          <p className="text-[12px] text-muted-foreground/30 font-mono">Waiting for response…</p>
        </div>
      ) : null}

      {visibleMessages.map((m, idx) => {
        const isUser = m.role === "user";
        const isLast = idx === visibleMessages.length - 1;

        return (
          <div
            key={m.id}
            className={cn(
              "flex",
              isUser ? "justify-end" : "justify-start",
            )}
          >
            {!isUser && (
              <div className="mr-2 mt-1 shrink-0">
                <div className="size-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <span className="font-mono text-[8px] text-primary/80 font-bold">G</span>
                </div>
              </div>
            )}
            <div
              className={cn(
                "max-w-[min(85%,520px)] rounded-2xl text-[13px] leading-relaxed",
                isUser
                  ? "bg-foreground/90 px-4 py-2.5 text-background rounded-br-sm"
                  : "px-4 py-3 text-foreground/90 rounded-bl-sm",
                !isUser && "bg-white/[0.04] border border-white/[0.07]",
              )}
            >
              {isUser ? (
                <div className="whitespace-pre-wrap">{messagePlainText(m)}</div>
              ) : (
                <AssistantBubbleBody
                  text={messagePlainText(m)}
                  streaming={lastIsAssistantStreaming && isLast}
                />
              )}
            </div>
          </div>
        );
      })}

      {showThinking ? (
        <div className="flex justify-start pl-8">
          <div className="rounded-2xl rounded-bl-sm bg-white/[0.04] border border-white/[0.07] px-4 py-3">
            <ThinkingDots />
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} className="h-px" />
    </div>
  );
}
