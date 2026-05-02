"use client";

import type { ReactNode } from "react";

import { Heading, Label, PrimaryBtn } from "./onboarding-steps-ui";
import ReactMarkdown from "react-markdown";

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
    <div className="flex h-[620px] flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/[0.06] px-6 pt-6 pb-4">
        <Label>Grill Me</Label>
        <h2 className="text-[18px] font-semibold text-foreground leading-tight">
          Fortæl om din forretning
        </h2>
        <p className="mt-1 text-[12px] text-muted-foreground/60">
          Samme agent som i dashboard. Bliv ved, indtil dit soul-dokument er gemt — så åbner editoren i
          fuld skærm.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">{grillChatPhase}</div>

      <div className="shrink-0 border-t border-white/[0.05] px-6 py-4">
        {!canProceedFromChat ? (
          <p className="text-[12px] text-muted-foreground/50">
            Svar assistenten til den er færdig. Når du ser bekræftelse på at soul-filen er gemt, kan du
            fortsætte til editoren.
          </p>
        ) : (
          <div className="flex justify-end">
            <PrimaryBtn onClick={onProceedToSoulEditor} className="px-6">
              Gennemgå / rediger soul →
            </PrimaryBtn>
          </div>
        )}
      </div>
    </div>
  );
}

export function Step8({
  bizName,
  soulMarkdown,
  onEnter,
}: {
  bizName: string;
  soulMarkdown: string;
  onEnter: () => void;
}) {
  const md = soulMarkdown.trim();

  return (
    <div className="stagger-children">
      <Label>Your Business Soul</Label>
      <Heading>Her er hvad vi gemte.</Heading>
      <p className="text-[14px] text-muted-foreground/60 leading-relaxed mb-6">
        Denne profil er tilknyttet <span className="text-foreground/80">{bizName || "din virksomhed"}</span>{" "}
        og bruges i agent-kørsler.
      </p>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-6 py-5 mb-8 max-h-[min(48vh,440px)] overflow-y-auto">
        {md ? (
          <div className="onboarding-prose text-[13px] leading-relaxed text-foreground/85">
            <ReactMarkdown>{md}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground/50">
            Ingen soul-markdown — gå tilbage og fuldfør Grill-Me-chatten.
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <PrimaryBtn onClick={onEnter} className="px-8 py-3 text-[15px]">
          Gå til workspace →
        </PrimaryBtn>
      </div>
    </div>
  );
}
