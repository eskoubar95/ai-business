"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Chat } from "@/components/grill-me/chat";
import LetterGlitch from "@/components/ui/letter-glitch";
import { createBusinessWithDetails, saveBusinessSoulFromOnboarding } from "@/lib/grill-me/actions";
import { LOADING_MESSAGES, TOTAL_STEPS } from "@/lib/onboarding/constants";
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

export function OnboardingClient() {
  const router = useRouter();

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
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [businessCreateError, setBusinessCreateError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [chatPhase, setChatPhase] = useState<"chat" | "editor">("chat");
  const [soulCaptured, setSoulCaptured] = useState(false);
  const [capturedSoulMarkdown, setCapturedSoulMarkdown] = useState("");
  const [soulMarkdownDraft, setSoulMarkdownDraft] = useState("");
  const [celebrationMarkdown, setCelebrationMarkdown] = useState("");
  const [editorPersisting, setEditorPersisting] = useState(false);

  const [editorMessages, setEditorMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "What do you think about this profile? Feel free to edit anything on the left — I can help you refine any part.",
    },
  ]);
  const [editorInput, setEditorInput] = useState("");

  const createInFlightRef = useRef(false);

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
    if (step !== 6 || !creatingBusiness) return;
    setLoadingMsgIdx(0);
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [step, creatingBusiness]);

  async function handleCreateBusinessAndOpenGrill() {
    if (!bizName.trim() || createInFlightRef.current) return;
    createInFlightRef.current = true;
    setBusinessCreateError(null);
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
      setChatPhase("chat");
      goTo(7);
    } catch (e) {
      setBusinessCreateError(e instanceof Error ? e.message : "Could not create business");
      goTo(5);
    } finally {
      setCreatingBusiness(false);
      createInFlightRef.current = false;
    }
  }

  function sendEditorMessage(quote?: string) {
    const text = editorInput.trim();
    if (!text) return;
    setEditorMessages((prev) => [...prev, { role: "user", content: text, quote }]);
    setEditorInput("");
    setTimeout(() => {
      setEditorMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: quote
            ? `Good question about that section. Feel free to edit it directly — I can help you refine any part further.`
            : "Great point! Feel free to edit that directly in the document — I'm here if you want to discuss anything further.",
        },
      ]);
    }, 900);
  }

  function proceedToSoulEditor() {
    setSoulMarkdownDraft(capturedSoulMarkdown);
    setChatPhase("editor");
  }

  async function finalizeEditorAndCelebrate() {
    if (!businessId || !soulMarkdownDraft.trim()) return;
    setEditorPersisting(true);
    try {
      await saveBusinessSoulFromOnboarding(businessId, soulMarkdownDraft);
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

  const isStep7 = step === 7;
  const cardMaxW = isStep7
    ? chatPhase === "editor"
      ? "max-w-5xl"
      : "max-w-3xl"
    : step === 8
      ? "max-w-[600px]"
      : "max-w-[520px]";
  const cardPadding = isStep7 ? "p-0 overflow-hidden" : step === 8 ? "p-8" : "p-8";
  const progressPct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

  const grillBusinessType = bizType === "new" ? "new" : "existing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background py-8">
      <div className="absolute inset-0 z-0">
        <LetterGlitch
          glitchColors={["#1a2e1a", "#a3e635", "#4a7c3f"]}
          glitchSpeed={80}
          outerVignette={true}
          centerVignette={false}
          smooth={true}
        />
      </div>

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
          {step === 6 && <Step6 msgIdx={loadingMsgIdx} />}
          {step === 7 && businessId && (
            <Step7
              bizName={bizName}
              chatPhase={chatPhase}
              grillChatPhase={
                <Chat
                  key={businessId}
                  businessId={businessId}
                  businessType={grillBusinessType}
                  initialTurns={[]}
                  initialSoulMarkdown={null}
                  embedded
                  showSoulPreview={false}
                  messageListClassName="max-h-[min(42vh,380px)] min-h-[200px] flex-1 border-border/50 bg-background/30"
                  onSoulCaptured={(md) => {
                    setCapturedSoulMarkdown(md);
                    setSoulCaptured(true);
                  }}
                />
              }
              onProceedToSoulEditor={proceedToSoulEditor}
              canProceedFromChat={soulCaptured}
              editorMessages={editorMessages}
              editorInput={editorInput}
              setEditorInput={setEditorInput}
              onEditorSend={sendEditorMessage}
              soulMarkdownDraft={soulMarkdownDraft}
              setSoulMarkdownDraft={setSoulMarkdownDraft}
              onFinalizeEditorToDashboard={finalizeEditorAndCelebrate}
              editorContinueLoading={editorPersisting}
            />
          )}
          {step === 8 && (
            <Step8
              bizName={bizName}
              soulMarkdown={celebrationMarkdown}
              onEnter={() => router.push("/dashboard")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
