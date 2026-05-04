"use client";

import type { ReactNode } from "react";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Heading, Label, PrimaryBtn } from "./onboarding-steps-ui";

export function Step7({
  grillChatPhase,
  onProceedToSoulEditor,
  canProceedFromChat,
}: {
  grillChatPhase: ReactNode;
  onProceedToSoulEditor: () => void;
  canProceedFromChat: boolean;
}) {
  return (
    <div className="flex h-[min(88vh,860px)] flex-col overflow-hidden">
      {/* Header — compact */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="size-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="font-mono text-[9px] text-primary/90 font-bold leading-none">G</span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-foreground/90 leading-none">Grill-Me</p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-none">
              Tell us about your business
            </p>
          </div>
        </div>
        {canProceedFromChat && (
          <PrimaryBtn onClick={onProceedToSoulEditor} className="px-4 text-[12px] h-8">
            Review soul →
          </PrimaryBtn>
        )}
      </div>

      {/* Chat — fills all remaining space */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{grillChatPhase}</div>

      {/* Footer hint — only when not done */}
      {!canProceedFromChat && (
        <div className="shrink-0 border-t border-white/[0.04] px-5 py-2.5">
          <p className="text-[11px] text-muted-foreground/35 text-center">
            Stay in chat until your soul file is saved, then continue.
          </p>
        </div>
      )}
    </div>
  );
}

export function Step8({
  bizName,
  soulMarkdown,
  workspaceHref = "/dashboard",
}: {
  bizName: string;
  soulMarkdown: string;
  /** Next.js route to open after onboarding (prefetched on mount). */
  workspaceHref?: string;
}) {
  const router = useRouter();
  const [workspaceNavPending, startWorkspaceNav] = useTransition();
  const md = soulMarkdown.trim();

  useEffect(() => {
    void router.prefetch(workspaceHref);
  }, [router, workspaceHref]);

  return (
    <div className="stagger-children">
      <Label>Your Business Soul</Label>
      <Heading>Her er hvad vi gemte.</Heading>
      <p className="text-[14px] text-muted-foreground/60 leading-relaxed mb-6">
        Denne profil er tilknyttet <span className="text-foreground/80">{bizName || "din virksomhed"}</span>{" "}
        og bruges i agent-kørsler.
      </p>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-6 py-5 mb-8 max-h-[min(48vh,440px)] overflow-y-auto overflow-x-hidden">
        {md ? (
          <div className="onboarding-prose text-[13px] leading-relaxed text-foreground/85 min-w-0 overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground/50">
            Ingen soul-markdown — gå tilbage og fuldfør Grill-Me-chatten.
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <PrimaryBtn
          onClick={() => startWorkspaceNav(() => router.push(workspaceHref))}
          disabled={workspaceNavPending}
          aria-busy={workspaceNavPending}
          className="px-8 py-3 text-[15px]"
        >
          {workspaceNavPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              Åbner workspace…
            </span>
          ) : (
            "Gå til workspace →"
          )}
        </PrimaryBtn>
      </div>
    </div>
  );
}
