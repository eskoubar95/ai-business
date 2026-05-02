"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LetterGlitch from "@/components/ui/letter-glitch";
import { AI_RESPONSES, LOADING_MESSAGES, TOTAL_STEPS } from "@/lib/onboarding/constants";
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
  const directionRef = useRef<"forward" | "back">("forward");
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

  const [chatPhase, setChatPhase] = useState<"chat" | "editor">("chat");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "Hi! I'm here to understand your business. What problem are you solving, and who are your target users?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  const [editorMessages, setEditorMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "What do you think about this profile? Feel free to edit anything above — I'll help you refine it.",
    },
  ]);
  const [editorInput, setEditorInput] = useState("");

  function goTo(s: number) {
    const dir = s > step ? "forward" : "back";
    directionRef.current = dir;
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
    if (step !== 6) return;
    setLoadingMsgIdx(0);
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 1500);
    const timer = setTimeout(() => {
      clearInterval(interval);
      goTo(7);
    }, 4000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  function sendMessage() {
    const text = chatInput.trim();
    if (!text || isThinking) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setChatInput("");
    setIsThinking(true);

    const next = exchangeCount + 1;
    setExchangeCount(next);

    const response = AI_RESPONSES[Math.min(next - 1, AI_RESPONSES.length - 1)];

    setTimeout(() => {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: response.content, thinking: response.thinking },
      ]);
    }, 1200);
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

  const isStep7 = step === 7;
  const cardMaxW = isStep7
    ? chatPhase === "editor"
      ? "max-w-5xl"
      : "max-w-3xl"
    : step === 8
    ? "max-w-[600px]"
    : "max-w-[520px]";
  const cardPadding = isStep7 ? "p-0 overflow-hidden" : "p-8";
  const progressPct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

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
              onBack={() => goTo(4)}
              onNext={() => goTo(6)}
              progressPct={progressPct}
            />
          )}
          {step === 6 && <Step6 msgIdx={loadingMsgIdx} />}
          {step === 7 && (
            <Step7
              messages={messages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSend={sendMessage}
              onFinishChat={() => setChatPhase("editor")}
              exchangeCount={exchangeCount}
              isThinking={isThinking}
              chatEndRef={chatEndRef}
              chatPhase={chatPhase}
              editorMessages={editorMessages}
              editorInput={editorInput}
              setEditorInput={setEditorInput}
              onEditorSend={sendEditorMessage}
              onContinue={() => goTo(8)}
              bizName={bizName}
            />
          )}
          {step === 8 && (
            <Step8 bizName={bizName} onEnter={() => router.push("/dashboard")} />
          )}
        </div>
      </div>
    </div>
  );
}
