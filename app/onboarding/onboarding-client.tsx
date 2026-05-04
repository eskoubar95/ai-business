"use client";

import { useEffect, useRef, useState } from "react";

import { Chat } from "@/components/grill-me/chat";
import { GrillSoulEditor } from "@/components/grill-me/grill-soul-editor";
import LetterGlitch from "@/components/ui/letter-glitch";
import {
  createBusinessWithDetails,
  deleteOnboardingDraftBusiness,
  getActiveOnboardingBusiness,
  getSoulEditorOpeningGuidance,
  refineGrillSoulDocument,
  saveBusinessSoulFromOnboarding,
  updateOnboardingPhase,
} from "@/lib/grill-me/actions";
import type { GrillMeMessage } from "@/lib/grill-me/session-queries";
import { normalizeSoulMarkdownForEditor } from "@/lib/grill-me/soul-markdown-normalize";
import { runGrillReasoningPhase } from "@/lib/grill-me/reasoning-actions";
import { LOADING_MESSAGES, PREPARING_GRILL_STEPS, TOTAL_STEPS } from "@/lib/onboarding/constants";
import type { BizType, ChatMessage, KeyStatus, Role } from "@/lib/onboarding/types";
import {
  Step1,
  Step2,
  Step3,
  Step4,
  Step5,
  Step6,
} from "./onboarding-steps-1-6";
import { Step7, Step8 } from "./onboarding-steps-grill";

function soulEditorSideChatStorageKey(businessId: string): string {
  return `onboarding-soul-editor-sidechat:${businessId}`;
}

/** Restore side-panel refinement thread after refresh (same browser tab/session). */
function parseStoredEditorChat(raw: string): {
  messages: ChatMessage[];
  input: string;
} | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const messages = (parsed as { messages?: unknown }).messages;
    const input = (parsed as { input?: unknown }).input;
    if (!Array.isArray(messages) || messages.length === 0) return null;
    const cleaned: ChatMessage[] = [];
    for (const m of messages) {
      if (!m || typeof m !== "object") return null;
      const r = (m as { role?: unknown }).role;
      const c = (m as { content?: unknown }).content;
      if ((r !== "ai" && r !== "user") || typeof c !== "string") return null;
      const msg: ChatMessage = { role: r, content: c };
      const thinking = (m as { thinking?: unknown }).thinking;
      const quote = (m as { quote?: unknown }).quote;
      if (typeof thinking === "string") msg.thinking = thinking;
      if (typeof quote === "string") msg.quote = quote;
      cleaned.push(msg);
    }
    return { messages: cleaned, input: typeof input === "string" ? input : "" };
  } catch {
    return null;
  }
}

export function OnboardingClient() {
  const [step, setStep] = useState(1);
  const [cardAnim, setCardAnim] = useState<string>("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("Founder");

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>("idle");

  const [bizName, setBizName] = useState("");
  const [bizDesc, setBizDesc] = useState("");
  const [bizType, setBizType] = useState<BizType>("new");
  const [githubUrl, setGithubUrl] = useState("");

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [loaderPhase, setLoaderPhase] = useState<"creating" | "preparing">("creating");
  const [prepStepIdx, setPrepStepIdx] = useState(0);
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [businessCreateError, setBusinessCreateError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [chatPhase, setChatPhase] = useState<"chat" | "editor">("chat");
  const [soulCaptured, setSoulCaptured] = useState(false);
  const [capturedSoulMarkdown, setCapturedSoulMarkdown] = useState("");
  const [soulMarkdownDraft, setSoulMarkdownDraft] = useState("");
  const [celebrationMarkdown, setCelebrationMarkdown] = useState("");
  const [editorPersisting, setEditorPersisting] = useState(false);

  // Resumed session data — loaded from DB when restoring a saved session
  const [resumedTurns, setResumedTurns] = useState<GrillMeMessage[]>([]);
  const [resumedSoulMarkdown, setResumedSoulMarkdown] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);
  const resumeAttemptedRef = useRef(false);

  const [editorMessages, setEditorMessages] = useState<ChatMessage[]>([]);
  const [editorOpeningLoading, setEditorOpeningLoading] = useState(false);
  const [editorInput, setEditorInput] = useState("");

  const createInFlightRef = useRef(false);

  // ── Resume in-progress onboarding from DB on mount ────────────────────────
  useEffect(() => {
    if (resumeAttemptedRef.current) return;
    resumeAttemptedRef.current = true;

    setResuming(true);
    void (async () => {
      try {
        const active = await getActiveOnboardingBusiness();
        if (!active) return;

        setBusinessId(active.businessId);
        setBizName(active.bizName);
        setResumedTurns(active.turns);
        setResumedSoulMarkdown(active.soulMarkdown);

        if (active.soulMarkdown) {
          setSoulCaptured(true);
          setCapturedSoulMarkdown(active.soulMarkdown);
          setSoulMarkdownDraft(active.soulMarkdown);
        }

        if (active.onboardingPhase === "grill_editor") {
          setChatPhase("editor");
          if (typeof window !== "undefined") {
            const raw = window.sessionStorage.getItem(
              soulEditorSideChatStorageKey(active.businessId),
            );
            const restored = raw ? parseStoredEditorChat(raw) : null;
            if (restored) {
              setEditorMessages(restored.messages);
              setEditorInput(restored.input);
            } else if (
              active.soulMarkdown &&
              active.businessId &&
              active.soulMarkdown.trim().length > 0
            ) {
              setEditorOpeningLoading(true);
              setEditorMessages([]);
              void (async () => {
                try {
                  const { guidance } = await getSoulEditorOpeningGuidance(
                    active.businessId!,
                    active.soulMarkdown!,
                    {
                      businessProfile:
                        active.businessProfile === "new" ? "new" : "existing",
                    },
                  );
                  setEditorMessages([{ role: "ai", content: guidance }]);
                } catch {
                  setEditorMessages([
                    {
                      role: "ai",
                      content:
                        "Kunne ikke hente AI-vejledning. Skriv i feltet nedenfor, eller prøv at genindlæse siden.",
                    },
                  ]);
                } finally {
                  setEditorOpeningLoading(false);
                }
              })();
            }
          }
        }

        setStep(7);
      } catch {
        // auth not ready yet — proceed normally from step 1
      } finally {
        setResuming(false);
      }
    })();
  }, []);

  function goTo(s: number) {
    const dir = s > step ? "forward" : "back";
    setCardAnim(`card-exit-${dir}`);
    setTimeout(() => {
      setStep(s);
      setCardAnim(`card-enter-${dir}`);
      setTimeout(() => {
        setCardAnim("");
      }, 380);
    }, 180);
  }

  useEffect(() => {
    if (step !== 6 || loaderPhase !== "creating" || !creatingBusiness) return;
    setLoadingMsgIdx(0);
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [step, loaderPhase, creatingBusiness]);

  useEffect(() => {
    if (step !== 6 || loaderPhase !== "preparing") return;
    const hasGithub = githubUrl.trim().length > 0;
    const steps = PREPARING_GRILL_STEPS.filter(
      (s) => hasGithub || !s.toLowerCase().includes("github"),
    );
    setPrepStepIdx(0);
    const interval = setInterval(() => {
      setPrepStepIdx((prev) => Math.min(prev + 1, steps.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [step, loaderPhase, githubUrl]);

  async function handleCreateBusinessAndOpenGrill() {
    if (!bizName.trim() || createInFlightRef.current) return;
    createInFlightRef.current = true;
    setBusinessCreateError(null);
    setLoaderPhase("creating");
    goTo(6);
    setCreatingBusiness(true);
    try {
      const { id } = await createBusinessWithDetails({
        name: bizName.trim(),
        description: bizDesc.trim() || undefined,
        githubRepoUrl: githubUrl.trim() || undefined,
      });
      setBusinessId(id);
      setSoulCaptured(false);
      setCapturedSoulMarkdown("");
      setSoulMarkdownDraft("");
      setCreatingBusiness(false);
      setLoaderPhase("preparing");
      const reasoning = await runGrillReasoningPhase(
        id,
        bizType === "existing" ? "existing" : "new",
      );
      if (!reasoning.ok) {
        const rolled = await deleteOnboardingDraftBusiness(id);
        const base =
          reasoning.error || "Kunne ikke analysere dit projekt. Prøv igen.";
        setBusinessCreateError(
          rolled.ok
            ? base
            : `${base} Vi kunne ikke fjerne kladden automatisk — tjek dit workspace.`,
        );
        setLoaderPhase("creating");
        setBusinessId(null);
        goTo(5);
        return;
      }
      setChatPhase("chat");
      goTo(7);
    } catch (e) {
      setBusinessCreateError(e instanceof Error ? e.message : "Could not create business");
      setLoaderPhase("creating");
      goTo(5);
    } finally {
      setCreatingBusiness(false);
      createInFlightRef.current = false;
    }
  }

  const grillBusinessType = bizType === "new" ? "new" : "existing";

  const [editorBusy, setEditorBusy] = useState(false);

  async function sendEditorMessage(quote?: string, forcedUserMessage?: string) {
    const text = (forcedUserMessage ?? editorInput).trim();
    if (!text || editorBusy || !businessId) return;
    setEditorMessages((prev) => [...prev, { role: "user", content: text, quote }]);
    if (!forcedUserMessage) setEditorInput("");
    setEditorBusy(true);
    try {
      const { reply, updatedMarkdown } = await refineGrillSoulDocument(
        businessId,
        soulMarkdownDraft,
        text,
        quote,
        { businessProfile: grillBusinessType },
      );
      if (updatedMarkdown) {
        setSoulMarkdownDraft(normalizeSoulMarkdownForEditor(updatedMarkdown));
      }
      setEditorMessages((prev) => [...prev, { role: "ai", content: reply }]);
    } catch (e) {
      setEditorMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            e instanceof Error
              ? `Error: ${e.message}`
              : "Could not contact the AI — please try again.",
        },
      ]);
    } finally {
      setEditorBusy(false);
    }
  }

  async function proceedToSoulEditor() {
    setSoulMarkdownDraft(capturedSoulMarkdown);
    setEditorMessages([]);
    setEditorOpeningLoading(true);
    setChatPhase("editor");
    if (businessId) {
      try {
        await updateOnboardingPhase(businessId, "grill_editor");
      } catch {
        // phase is best-effort for telemetry; editor UX still works
      }
      void (async () => {
        try {
          const { guidance } = await getSoulEditorOpeningGuidance(businessId, capturedSoulMarkdown, {
            businessProfile: grillBusinessType,
          });
          setEditorMessages([{ role: "ai", content: guidance }]);
        } catch (e) {
          setEditorMessages([
            {
              role: "ai",
              content:
                e instanceof Error
                  ? `Kunne ikke hente vejledning: ${e.message}`
                  : "Kunne ikke hente AI-vejledning. Skriv i chatten for at fortsætte.",
            },
          ]);
        } finally {
          setEditorOpeningLoading(false);
        }
      })();
    } else {
      setEditorOpeningLoading(false);
      setEditorMessages([
        {
          role: "ai",
          content:
            "Ingen virksomhed fundet — genåbn onboarding for at få personlig finpudsnings-vejledning.",
        },
      ]);
    }
  }

  async function finalizeEditorAndCelebrate() {
    if (!businessId || !soulMarkdownDraft.trim()) return;
    setEditorPersisting(true);
    try {
      await saveBusinessSoulFromOnboarding(businessId, soulMarkdownDraft, {
        completeOnboarding: true,
      });
      try {
        window.sessionStorage.removeItem(soulEditorSideChatStorageKey(businessId));
      } catch {
        /* ignore */
      }
      setCelebrationMarkdown(soulMarkdownDraft);
      goTo(8);
    } catch (e) {
      setEditorMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            e instanceof Error
              ? `Could not save: ${e.message}`
              : "Could not save your soul file. Try again.",
        },
      ]);
    } finally {
      setEditorPersisting(false);
    }
  }

  const soulEditorFullscreen =
    step === 7 && Boolean(businessId) && chatPhase === "editor";

  const isStep7 = step === 7;
  const cardMaxW = isStep7
    ? "max-w-[860px]"
    : step === 8
      ? "max-w-[600px]"
      : "max-w-[520px]";
  const cardPadding = isStep7 ? "p-0 overflow-hidden" : step === 8 ? "p-8" : "p-8";
  const progressPct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

  if (resuming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative size-10">
            <div className="absolute inset-0 rounded-full border border-primary/20" />
            <div
              className="absolute inset-0 rounded-full border border-primary/50 border-t-primary animate-spin"
              style={{ animationDuration: "1s" }}
            />
          </div>
          <div>
            <p className="text-[14px] font-medium text-foreground/80">Resuming your session…</p>
            <p className="mt-1 text-[12px] text-muted-foreground/50">Loading your Grill-Me conversation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        soulEditorFullscreen
          ? "fixed inset-0 z-50 bg-background"
          : "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background py-8"
      }
    >
      {!soulEditorFullscreen && (
        <div className="absolute inset-0 z-0">
          <LetterGlitch
            glitchColors={["#1a2e1a", "#a3e635", "#4a7c3f"]}
            glitchSpeed={80}
            outerVignette={true}
            centerVignette={false}
            smooth={true}
          />
        </div>
      )}

      {soulEditorFullscreen && businessId ? (
        <GrillSoulEditor
          businessId={businessId}
          bizName={bizName}
          soulMarkdown={soulMarkdownDraft}
          setSoulMarkdown={setSoulMarkdownDraft}
          refinementMessages={editorMessages}
          editorInput={editorInput}
          setEditorInput={setEditorInput}
          onRefinementSend={(q, forced) => void sendEditorMessage(q, forced)}
          refinementBusy={editorBusy}
          openingGuidanceLoading={editorOpeningLoading}
          onDone={() => void finalizeEditorAndCelebrate()}
          doneLoading={editorPersisting}
          doneDisabled={!soulMarkdownDraft.trim()}
        />
      ) : (
        <div
          className={`relative z-10 w-full mx-4 bg-card border border-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden transition-[max-width,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${cardMaxW} ${cardPadding}${cardAnim ? ` ${cardAnim}` : ""}`}
        >
          <div key={step}>
            {step === 1 && (
              <Step1
                firstName={firstName}
                lastName={lastName}
                role={role}
                setFirstName={setFirstName}
                setLastName={setLastName}
                setRole={setRole}
                onNext={() => goTo(2)}
                progressPct={progressPct}
              />
            )}
            {step === 2 && <Step2 onBack={() => goTo(1)} onNext={() => goTo(3)} progressPct={progressPct} />}
            {step === 3 && <Step3 onBack={() => goTo(2)} onNext={() => goTo(4)} progressPct={progressPct} />}
            {step === 4 && (
              <Step4
                apiKey={apiKey}
                showKey={showKey}
                keyStatus={keyStatus}
                setApiKey={setApiKey}
                setShowKey={setShowKey}
                setKeyStatus={setKeyStatus}
                onNext={() => goTo(5)}
                progressPct={progressPct}
              />
            )}
            {step === 5 && (
              <Step5
                bizName={bizName}
                bizDesc={bizDesc}
                bizType={bizType}
                githubUrl={githubUrl}
                setBizName={setBizName}
                setBizDesc={setBizDesc}
                setBizType={setBizType}
                setGithubUrl={setGithubUrl}
                onBack={() => {
                  setBusinessCreateError(null);
                  goTo(4);
                }}
                onNext={() => void handleCreateBusinessAndOpenGrill()}
                progressPct={progressPct}
                createError={businessCreateError}
              />
            )}
            {step === 6 && (
              <Step6
                phase={loaderPhase}
                creatingMsgIdx={loadingMsgIdx}
                preparingStepIdx={prepStepIdx}
                hasGithub={githubUrl.trim().length > 0}
              />
            )}
            {step === 7 && businessId && (
              <Step7
                grillChatPhase={
                  <Chat
                    key={businessId}
                    businessId={businessId}
                    businessType={grillBusinessType}
                    initialTurns={resumedTurns}
                    initialSoulMarkdown={resumedSoulMarkdown}
                    embedded
                    showSoulPreview={false}
                    messageListClassName="flex-1 min-h-[200px] border-border/50 bg-background/30"
                    onSoulCaptured={(md) => {
                      setCapturedSoulMarkdown(md);
                      setSoulCaptured(true);
                    }}
                  />
                }
                onProceedToSoulEditor={proceedToSoulEditor}
                canProceedFromChat={soulCaptured}
              />
            )}
            {step === 8 && (
              <Step8 bizName={bizName} soulMarkdown={celebrationMarkdown} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
