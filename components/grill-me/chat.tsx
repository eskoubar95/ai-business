"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
} from "ai";
import { useEffect, useMemo, useState } from "react";

import { GRILL_ME_COMPLETE_MARKER } from "@/lib/grill-me/markers";
import { getBusinessSoulMemory } from "@/lib/grill-me/memory-read";
import type { GrillMeMessage } from "@/lib/grill-me/session-queries";
import { grillMessagesToUIMessages } from "@/lib/grill-me/ui-messages";
import type { GrillBusinessType } from "@/lib/grill-me/grill-prompt";

import { InputForm } from "./input-form";
import { MessageList } from "./message-list";
import { SoulFilePreview } from "./soul-file-preview";

export function Chat({
  businessId,
  businessType = "existing",
  initialTurns,
  initialSoulMarkdown,
}: {
  businessId: string;
  /** Onboarding path from Grill-Me setup (query param); forwarded to the UI API. */
  businessType?: GrillBusinessType;
  initialTurns: GrillMeMessage[];
  initialSoulMarkdown: string | null;
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
      void getBusinessSoulMemory(businessId).then(setSoulMarkdown);
    }
  }, [messages, businessId]);

  const pending = status !== "ready";

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Grill-Me</h1>
        <p className="text-muted-foreground text-sm">
          Structured onboarding chat for this business — powered by Vercel AI SDK UI.
        </p>
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error.message}
        </p>
      ) : null}
      <MessageList messages={messages} />
      <InputForm
        disabled={pending}
        onSend={(text) => {
          void sendMessage({ text });
        }}
      />
      {soulMarkdown ? <SoulFilePreview markdown={soulMarkdown} /> : null}
      {soulMarkdown ? (
        <p
          data-testid="grill-me-complete"
          className="text-muted-foreground text-sm"
        >
          Soul file saved — onboarding complete.
        </p>
      ) : null}
    </div>
  );
}
