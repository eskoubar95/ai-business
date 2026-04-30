"use client";

import { useEffect, useRef } from "react";

import type { UIMessage } from "ai";

function messagePlainText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function MessageList({ messages }: { messages: UIMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      data-testid="grill-me-message-list"
      className="border-border bg-muted/20 flex max-h-[50vh] flex-col gap-3 overflow-y-auto rounded-lg border p-4"
    >
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-foreground text-background"
                : "border-border bg-background text-foreground border"
            }`}
          >
            <div className="whitespace-pre-wrap">{messagePlainText(m)}</div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
