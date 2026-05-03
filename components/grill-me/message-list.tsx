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

function AssistantThinkingRow() {
  return (
    <div
      className="border-border bg-background/55 flex justify-start rounded-lg border border-dashed px-3 py-2.5"
      data-testid="grill-me-thinking"
      aria-busy="true"
      aria-label="Assistant is thinking"
    >
      <span className="text-muted-foreground flex items-center gap-2 font-mono text-[11px] tracking-wide uppercase">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/85" />
        </span>
        Thinking
      </span>
      <span className="ml-3 inline-flex gap-1 pt-1">
        <span className="bg-muted-foreground/45 size-1.5 animate-bounce rounded-full [animation-delay:-0.2s]" />
        <span className="bg-muted-foreground/45 size-1.5 animate-bounce rounded-full [animation-delay:-0.1s]" />
        <span className="bg-muted-foreground/45 size-1.5 animate-bounce rounded-full" />
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

  const prose =
    "prose prose-sm prose-invert max-w-none [&_p]:leading-relaxed [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px]";
  const body = (
    <div className={prose}>
      <Markdown>{trimmed}</Markdown>
    </div>
  );

  return (
    <>
      {body}
      {streaming ? (
        <span className="text-primary/80 animate-pulse font-mono text-xs" aria-hidden>
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
  /** Merges onto the scroll container (layout + max-height in wizards). */
  className?: string;
  embedded?: boolean;
  /** Request in flight — show thinking row until visible assistant tokens appear. */
  assistantBusy?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const showThinking = assistantBusy && assistantIsWorking(messages);
  const lastId = messages.length ? messages[messages.length - 1].id : null;
  const lastIsAssistantStreaming =
    assistantBusy &&
    !!lastId &&
    messages[messages.length - 1]?.role === "assistant" &&
    messagePlainText(messages[messages.length - 1]).trim() !== "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showThinking]);

  return (
    <div
      data-testid="grill-me-message-list"
      className={cn(
        "border-border bg-muted/20 flex flex-col gap-3 overflow-y-auto rounded-lg border p-4",
        className ?? "max-h-[50vh]",
      )}
    >
      {messages.map((m) => {
        if (
          m.role === "assistant" &&
          messagePlainText(m).trim() === "" &&
          showThinking
        ) {
          return null;
        }
        return (
        <div
          key={m.id}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={cn(
              "max-w-[min(92%,512px)] rounded-2xl text-sm leading-relaxed",
              m.role === "user"
                ? "bg-foreground px-4 py-2.5 text-background"
                : "border-border text-foreground border bg-black/25 px-3.5 py-2.5 dark:bg-white/[0.04]",
              embedded && m.role === "assistant" && "shadow-sm shadow-black/20",
            )}
          >
            {m.role === "user" ? (
              <div className="whitespace-pre-wrap">{messagePlainText(m)}</div>
            ) : (
              <AssistantBubbleBody
                text={messagePlainText(m)}
                streaming={
                  lastIsAssistantStreaming && m.id === lastId
                }
              />
            )}
          </div>
        </div>
        );
      })}
      {showThinking ? <AssistantThinkingRow /> : null}
      <div ref={bottomRef} />
    </div>
  );
}
