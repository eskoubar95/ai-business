"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Chat } from "@/components/grill-me/chat";
import { GrillSoulEditor } from "@/components/grill-me/grill-soul-editor";
import LetterGlitch from "@/components/ui/letter-glitch";
import { createBusinessWithDetails, deleteOnboardingDraftBusiness, saveBusinessSoulFromOnboarding } from "@/lib/grill-me/actions";
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

  const [editorMessages, setEditorMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "Her kan du se og rette dokumentet fra Grill-Me. Brug tekstfeltet nedenunder, når du er klar til at finpusse.",
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
    if (step !== 6 || loaderPhase !== "creating" || !creatingBusiness) return;
    setLoadingMsgIdx(0);
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [step, loaderPhase, creatingBusiness]);

  useEffect(() => {
    if (step !== 6 || loaderPhase !== "preparing") return;
    setPrepStepIdx(0);
    const interval = setInterval(() => {
      setPrepStepIdx((prev) => Math.min(prev + 1, PREPARING_GRILL_STEPS.length - 1));
    }, 700);
    return () => clearInterval(interval);
  }, [step, loaderPhase]);

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
            ? "Auto-redigering af dokumentet er ikke koblet på endnu — opdatér venligst selve markdown i midterfeltet ud fra dit uddrag. Jeg kan stadig hjælpe med formuleringer i chatten."
            : "Redigér gerne direkte i dokumentet til venstre. Sig til, hvis du vil have et udkast til en sektion.",
        },
      ]);
    }, 900);
  }

  function proceedToSoulEditor() {
    setSoulMarkdownDraft(capturedSoulMarkdown);
    setEditorMessages([
      {
        role: "ai",
        content:
          "Velkommen til soul-editoren. Markér tekst og brug «+ Tilføj til chat» for at citere et uddrag, eller skriv frit i side-chatten. Du kan slå versioner op under «Versioner» og skifte «Forhåndsvis» for at se sektioner med scroll-spy.",
      },
    ]);
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

  const soulEditorFullscreen =
    step === 7 && Boolean(businessId) && chatPhase === "editor";

  const isStep7 = step === 7;
  const cardMaxW = isStep7
    ? "max-w-3xl"
    : step === 8
      ? "max-w-[600px]"
      : "max-w-[520px]";
  const cardPadding = isStep7 ? "p-0 overflow-hidden" : step === 8 ? "p-8" : "p-8";
  const progressPct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

  const grillBusinessType = bizType === "new" ? "new" : "existing";

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
          onRefinementSend={sendEditorMessage}
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
              <Step6 phase={loaderPhase} creatingMsgIdx={loadingMsgIdx} preparingStepIdx={prepStepIdx} />
            )}
            {step === 7 && businessId && (
              <Step7
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
      )}
    </div>
  );
}
