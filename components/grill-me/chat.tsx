"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import { extractGrillQuickReplies } from "@/lib/grill-me/extract-quick-replies";
import { GRILL_ME_COMPLETE_MARKER } from "@/lib/grill-me/markers";
import { getBusinessSoulMemory } from "@/lib/grill-me/memory-read";
import type { GrillMeMessage } from "@/lib/grill-me/session-queries";
import { grillMessagesToUIMessages } from "@/lib/grill-me/ui-messages";
import type { GrillBusinessType } from "@/lib/grill-me/grill-prompt";

const GRILL_START_MARKER = "__GRILL_START__";

import { InputForm, type AttachedFile } from "./input-form";
import { MessageList, messagePlainText } from "./message-list";
import { SoulFilePreview } from "./soul-file-preview";

export function Chat({
  businessId,
  businessType = "existing",
  initialTurns,
  initialSoulMarkdown,
  embedded = false,
  messageListClassName,
  showSoulPreview = true,
  onSoulCaptured,
}: {
  businessId: string;
  businessType?: GrillBusinessType;
  initialTurns: GrillMeMessage[];
  initialSoulMarkdown: string | null;
  /** Compact layout inside the onboarding wizard card. */
  embedded?: boolean;
  messageListClassName?: string;
  showSoulPreview?: boolean;
  onSoulCaptured?: (markdown: string) => void;
}) {
  const initialMessages = useMemo(
    () => grillMessagesToUIMessages(initialTurns),
    [initialTurns],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/grill-me/ui",
        prepareSendMessagesRequest: ({ messages, id }) => {
          const last = messages[messages.length - 1];
          return {
            body: {
              chatId: id,
              businessId,
              businessType,
              message: last,
            },
          };
        },
      }),
    [businessId, businessType],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: `grill-me-${businessId}`,
    messages: initialMessages,
    transport,
  });

  const autoStartFiredRef = useRef(false);

  useEffect(() => {
    if (autoStartFiredRef.current) return;
    if (initialMessages.length > 0) return;
    autoStartFiredRef.current = true;
    void sendMessage({ text: GRILL_START_MARKER });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [soulMarkdown, setSoulMarkdown] = useState<string | null>(
    initialSoulMarkdown,
  );

  useEffect(() => {
    const assistants = messages.filter((m) => m.role === "assistant");
    const last = assistants[assistants.length - 1];
    if (!last) return;
    const full = last.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
    if (full.includes(GRILL_ME_COMPLETE_MARKER)) {
      void getBusinessSoulMemory(businessId).then((md) => {
        setSoulMarkdown(md);
        if (md) onSoulCaptured?.(md);
      });
    }
  }, [messages, businessId, onSoulCaptured]);

  const pending = status !== "ready";

  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          !(
            m.role === "user" &&
            m.parts.some(
              (p) => p.type === "text" && p.text === GRILL_START_MARKER,
            )
          ),
      ),
    [messages],
  );

  const quickReplies = useMemo(() => {
    if (pending || soulMarkdown) return [];
    const last = visibleMessages[visibleMessages.length - 1];
    if (!last || last.role !== "assistant") return [];
    const text = messagePlainText(last);
    return extractGrillQuickReplies(text);
  }, [visibleMessages, pending, soulMarkdown]);

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {error ? (
          <div className="shrink-0 px-4 py-2">
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-[12px] text-destructive" role="alert">
              {error.message}
            </p>
          </div>
        ) : null}

        <MessageList
          messages={visibleMessages}
          embedded
          assistantBusy={pending && !soulMarkdown}
          className={messageListClassName}
        />

        <InputForm
          embedded
          quickReplies={quickReplies}
          disabled={pending}
          placeholder="Reply… (Enter to send, Shift+Enter for newline)"
          onSend={(text, attachments) => {
            const fullText = buildMessageWithAttachments(text, attachments);
            void sendMessage({ text: fullText });
          }}
        />

        {soulMarkdown ? (
          <p
            data-testid="grill-me-complete"
            className="shrink-0 px-4 py-2 text-center text-[11px] font-mono text-primary/60 tracking-wide"
          >
            ✓ Soul saved — continue when ready
          </p>
        ) : null}
      </div>
    );
  }

  // Standalone dashboard page
  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Grill-Me</h1>
        <p className="text-muted-foreground text-sm">
          Structured onboarding chat for this business.
        </p>
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error.message}
        </p>
      ) : null}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card overflow-hidden">
        <MessageList
          messages={visibleMessages}
          assistantBusy={pending && !soulMarkdown}
          className={cn("px-4 pt-4 max-h-[60vh]", messageListClassName)}
        />
        <div className="border-t border-border px-4 pb-4 pt-3">
          <InputForm
            quickReplies={quickReplies}
            disabled={pending}
            placeholder="Describe your business…"
            onSend={(text, attachments) => {
              const fullText = buildMessageWithAttachments(text, attachments);
              void sendMessage({ text: fullText });
            }}
          />
        </div>
      </div>
      {soulMarkdown && showSoulPreview ? <SoulFilePreview markdown={soulMarkdown} /> : null}
      {soulMarkdown ? (
        <p data-testid="grill-me-complete" className="text-muted-foreground text-sm">
          Soul file saved — onboarding complete.
        </p>
      ) : null}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function buildMessageWithAttachments(text: string, attachments?: AttachedFile[]): string {
  if (!attachments || attachments.length === 0) return text;
  const fileList = attachments.map((a) => `- ${a.name} (${a.type})`).join("\n");
  const note = `\n\n[Attached files:\n${fileList}]`;
  return text ? text + note : `[Attached files:\n${fileList}]`;
}
