"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Check, Loader2, X } from "lucide-react";
import { verifyAndSaveCursorApiKey } from "@/lib/settings/actions";
import {
  LOADING_MESSAGES,
  PREPARING_GRILL_STEPS,
  ROLES,
} from "@/lib/onboarding/constants";
import type { BizType, KeyStatus, Role } from "@/lib/onboarding/types";
import {
  Body,
  BtnGhost,
  Heading,
  Input,
  Label,
  PrimaryBtn,
  ProgressBar,
  StepFooter,
} from "./onboarding-steps-ui";

export function Step1({
  firstName,
  lastName,
  role,
  setFirstName,
  setLastName,
  setRole,
  onNext,
  progressPct,
}: {
  firstName: string;
  lastName: string;
  role: Role;
  setFirstName: Dispatch<SetStateAction<string>>;
  setLastName: Dispatch<SetStateAction<string>>;
  setRole: Dispatch<SetStateAction<Role>>;
  onNext: () => void;
  progressPct: number;
}) {
  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0;
  return (
    <div className="stagger-children">
      <Label>Your Profile</Label>
      <Heading>Welcome. Let&apos;s get you set up.</Heading>
      <ProgressBar pct={progressPct} />
      <p className="text-[14px] text-muted-foreground/60 leading-relaxed mb-6">
        A few quick details to personalise your experience.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[11px] text-muted-foreground/40 mb-1.5 font-mono uppercase tracking-wider">First name</p>
          <Input value={firstName} onChange={setFirstName} placeholder="Ada" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground/40 mb-1.5 font-mono uppercase tracking-wider">Last name</p>
          <Input value={lastName} onChange={setLastName} placeholder="Lovelace" />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[11px] text-muted-foreground/40 mb-2 font-mono uppercase tracking-wider">Your role</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-full border px-4 py-1.5 text-[12px] cursor-pointer transition-all ${
                role === r
                  ? "border-primary/50 text-primary bg-primary/[0.08]"
                  : "border-border text-muted-foreground/50 bg-white/[0.03] hover:border-white/[0.15]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <StepFooter>
        <span />
        <PrimaryBtn onClick={onNext} disabled={!canContinue}>
          Continue →
        </PrimaryBtn>
      </StepFooter>
    </div>
  );
}

export function Step2({ onBack, onNext, progressPct }: { onBack: () => void; onNext: () => void; progressPct: number }) {
  return (
    <div className="stagger-children">
      <Label>What is this</Label>
      <Heading>Your AI business, orchestrated.</Heading>
      <ProgressBar pct={progressPct} />
      <Body>
        Manage AI agents, coordinate teams, and ship faster — all from one place.
        Built for founders who move fast.
      </Body>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 mb-6 flex items-center justify-center">
        <svg width="200" height="80" viewBox="0 0 200 80" fill="none" aria-hidden>
          <circle cx="24" cy="40" r="10" fill="rgba(107,184,0,0.1)" stroke="rgba(107,184,0,0.35)" strokeWidth="1.5" />
          <circle cx="100" cy="18" r="10" fill="rgba(107,184,0,0.1)" stroke="rgba(107,184,0,0.35)" strokeWidth="1.5" />
          <circle cx="176" cy="40" r="10" fill="rgba(107,184,0,0.1)" stroke="rgba(107,184,0,0.35)" strokeWidth="1.5" />
          <circle cx="62" cy="62" r="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="138" cy="62" r="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <line x1="34" y1="37" x2="90" y2="22" stroke="rgba(107,184,0,0.3)" strokeWidth="1" />
          <line x1="110" y1="22" x2="166" y2="37" stroke="rgba(107,184,0,0.3)" strokeWidth="1" />
          <line x1="30" y1="46" x2="57" y2="58" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="68" y1="62" x2="132" y2="62" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="143" y1="58" x2="170" y2="46" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />
          <text x="18" y="44" fill="rgba(107,184,0,0.7)" fontSize="8" fontFamily="monospace">AI</text>
          <text x="93" y="22" fill="rgba(107,184,0,0.7)" fontSize="8" fontFamily="monospace">AI</text>
          <text x="170" y="44" fill="rgba(107,184,0,0.7)" fontSize="8" fontFamily="monospace">AI</text>
        </svg>
      </div>

      <StepFooter>
        <BtnGhost onClick={onBack}>Back</BtnGhost>
        <PrimaryBtn onClick={onNext}>Next →</PrimaryBtn>
      </StepFooter>
    </div>
  );
}

export function Step3({ onBack, onNext, progressPct }: { onBack: () => void; onNext: () => void; progressPct: number }) {
  return (
    <div className="stagger-children">
      <Label>Built on</Label>
      <Heading>Cursor Engineering</Heading>
      <ProgressBar pct={progressPct} />
      <Body>
        Every agent in your workspace runs locally via Cursor CLI. Your code, your
        machine, your rules.
      </Body>

      <div className="mb-6">
        <span className="font-mono text-primary text-[13px] bg-primary/[0.07] border border-primary/20 rounded px-3 py-1.5 inline-block">
          &gt; cursor run agent --task &quot;ship it&quot;
        </span>
      </div>

      <StepFooter>
        <BtnGhost onClick={onBack}>Back</BtnGhost>
        <PrimaryBtn onClick={onNext}>Next →</PrimaryBtn>
      </StepFooter>
    </div>
  );
}

export function Step4({
  apiKey,
  showKey,
  keyStatus,
  setApiKey,
  setShowKey,
  setKeyStatus,
  onNext,
  progressPct,
}: {
  apiKey: string;
  showKey: boolean;
  keyStatus: KeyStatus;
  setApiKey: Dispatch<SetStateAction<string>>;
  setShowKey: Dispatch<SetStateAction<boolean>>;
  setKeyStatus: Dispatch<SetStateAction<KeyStatus>>;
  onNext: () => void;
  progressPct: number;
}) {
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validationSeqRef = useRef(0);
  const pasteTriggersValidationRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.removeItem("cursor_api_key");
    } catch {
      /* ignore */
    }
  }, []);

  const runValidation = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setKeyStatus("idle");
      setVerificationMessage(null);
      return;
    }
    const seq = ++validationSeqRef.current;
    setKeyStatus("loading");
    setVerificationMessage(null);
    void verifyAndSaveCursorApiKey(trimmed)
      .then((result) => {
        if (seq !== validationSeqRef.current) return;
        if (result.success) {
          setVerificationMessage(null);
          setKeyStatus("connected");
        } else {
          setVerificationMessage(result.message);
          setKeyStatus("error");
        }
      })
      .catch(() => {
        if (seq !== validationSeqRef.current) return;
        setVerificationMessage("Could not validate the key. Try again.");
        setKeyStatus("error");
      });
  };

  useEffect(() => {
    if (keyStatus !== "connected") return;
    autoAdvanceRef.current = setTimeout(() => {
      onNext();
    }, 1200);
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [keyStatus, onNext]);

  const inputBorderClass =
    keyStatus === "connected"
      ? "border-green-500/50 shadow-[0_0_14px_rgba(34,197,94,0.13)]"
      : keyStatus === "error"
      ? "border-red-500/40 shadow-[0_0_14px_rgba(239,68,68,0.10)]"
      : keyStatus === "loading"
      ? "border-primary/40 key-input-loading"
      : "border-border focus:border-primary/50";

  const canValidate = apiKey.trim().length > 0 && keyStatus !== "loading";

  return (
    <div className="stagger-children">
      <Label>Required</Label>
      <Heading>Connect Cursor</Heading>
      <ProgressBar pct={progressPct} />
      <Body>
        Enter your Cursor API key so Grill-Me and agents can run. We check it with Cursor&apos;s API
        (no agent run) and store it encrypted on your account.
      </Body>

      <p className="text-[12px] text-muted-foreground/55 leading-snug -mt-2 mb-3">
        Pasting the key runs validation automatically. If you type it yourself, press{" "}
        <span className="text-foreground/70 font-medium">Validate</span> when you&apos;re done.
      </p>

      <div className="mb-2">
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onPaste={() => {
            pasteTriggersValidationRef.current = true;
          }}
          onChange={(e) => {
            const v = e.target.value;
            setApiKey(v);
            if (pasteTriggersValidationRef.current) {
              pasteTriggersValidationRef.current = false;
              runValidation(v);
              return;
            }
            if (keyStatus !== "idle" || verificationMessage) {
              setKeyStatus("idle");
              setVerificationMessage(null);
            }
          }}
          placeholder="sk-cursor-..."
          autoComplete="off"
          spellCheck={false}
          aria-invalid={keyStatus === "error"}
          aria-busy={keyStatus === "loading"}
          className={`bg-white/[0.04] border rounded-lg px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-all w-full font-mono ${inputBorderClass}`}
        />
      </div>

      <div
        className="rounded-lg border border-border/60 bg-white/[0.02] px-3 py-2.5 mb-3 min-h-[44px] flex items-start gap-2.5"
        role="status"
        aria-live="polite"
      >
        {keyStatus === "idle" && (
          <p className="text-[12px] text-muted-foreground/50 leading-relaxed pt-0.5">
            Ready — paste your key or type it, then use Validate.
          </p>
        )}
        {keyStatus === "loading" && (
          <p className="text-[12px] text-primary/80 flex items-center gap-2 leading-relaxed">
            <Loader2 size={14} className="animate-spin shrink-0 mt-0.5" />
            <span>Contacting Cursor to verify your key…</span>
          </p>
        )}
        {keyStatus === "connected" && (
          <p className="text-[12px] text-green-400/90 flex items-start gap-2 leading-relaxed">
            <Check size={14} className="shrink-0 mt-0.5" strokeWidth={2.25} />
            <span>Verified and saved. Continuing in a moment…</span>
          </p>
        )}
        {keyStatus === "error" && (
          <p className="text-[12px] text-red-400/85 flex items-start gap-2 leading-relaxed">
            <X size={14} className="shrink-0 mt-0.5" strokeWidth={2.25} />
            <span>{verificationMessage ?? "That key did not work. Try again."}</span>
          </p>
        )}
      </div>

      <a
        href="https://cursor.com/settings"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-muted-foreground/30 underline hover:text-muted-foreground/50 transition-colors mb-4 inline-block"
      >
        Where do I find my API key?
      </a>

      <StepFooter>
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          className="text-[12px] text-muted-foreground/45 hover:text-foreground/70 underline underline-offset-2 transition-colors"
        >
          {showKey ? "Hide key" : "Show key"}
        </button>
        <PrimaryBtn
          type="button"
          disabled={!canValidate}
          onClick={() => runValidation(apiKey)}
          aria-busy={keyStatus === "loading"}
        >
          {keyStatus === "loading" ? "Validating…" : "Validate"}
        </PrimaryBtn>
      </StepFooter>
    </div>
  );
}

export function Step5({
  bizName,
  bizDesc,
  bizType,
  githubUrl,
  setBizName,
  setBizDesc,
  setBizType,
  setGithubUrl,
  onBack,
  onNext,
  progressPct,
  createError,
}: {
  bizName: string;
  bizDesc: string;
  bizType: BizType;
  githubUrl: string;
  setBizName: Dispatch<SetStateAction<string>>;
  setBizDesc: Dispatch<SetStateAction<string>>;
  setBizType: Dispatch<SetStateAction<BizType>>;
  setGithubUrl: Dispatch<SetStateAction<string>>;
  onBack: () => void;
  onNext: () => void;
  progressPct: number;
  createError?: string | null;
}) {
  return (
    <div className="stagger-children">
      <Label>Your Workspace</Label>
      <Heading>Create your business</Heading>
      <ProgressBar pct={progressPct} />
      <p className="text-[14px] text-muted-foreground/60 leading-relaxed mb-6">
        Set up your workspace to start orchestrating agents and teams.
      </p>

      <div className="space-y-4 mb-4">
        <div>
          <p className="text-[11px] text-muted-foreground/40 mb-1.5 font-mono uppercase tracking-wider">
            Business name <span className="text-primary/60">*</span>
          </p>
          <Input value={bizName} onChange={setBizName} placeholder="MercFlow AI" />
        </div>

        <div>
          <p className="text-[11px] text-muted-foreground/40 mb-1.5 font-mono uppercase tracking-wider">
            Description
          </p>
          <textarea
            value={bizDesc}
            onChange={(e) => setBizDesc(e.target.value)}
            placeholder="What does your business do?"
            rows={3}
            className="bg-white/[0.04] border border-border rounded-lg px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all w-full resize-none h-20"
          />
        </div>

        <div>
          <p className="text-[11px] text-muted-foreground/40 mb-2 font-mono uppercase tracking-wider">
            Business type
          </p>
          <div className="flex gap-2">
            {(["new", "existing"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setBizType(t)}
                className={`rounded-full border px-4 py-1.5 text-[12px] cursor-pointer transition-all ${
                  bizType === t
                    ? "border-primary/50 text-primary bg-primary/[0.08]"
                    : "border-border text-muted-foreground/50 bg-white/[0.03] hover:border-white/[0.15]"
                }`}
              >
                {t === "new" ? "New business" : "Existing business"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] text-muted-foreground/40 mb-1.5 font-mono uppercase tracking-wider">
            GitHub repo <span className="text-muted-foreground/20">(optional)</span>
          </p>
          <Input value={githubUrl} onChange={setGithubUrl} placeholder="https://github.com/you/repo" />
        </div>
      </div>

      {createError ? (
        <p className="mb-4 text-[12px] text-destructive" role="alert">
          {createError}
        </p>
      ) : null}

      <StepFooter>
        <BtnGhost onClick={onBack}>Back</BtnGhost>
        <PrimaryBtn onClick={onNext} disabled={!bizName.trim()}>
          Set Up →
        </PrimaryBtn>
      </StepFooter>
    </div>
  );
}

export function Step6({
  phase,
  creatingMsgIdx,
  preparingStepIdx,
  hasGithub = false,
}: {
  phase: "creating" | "preparing";
  creatingMsgIdx: number;
  preparingStepIdx: number;
  hasGithub?: boolean;
}) {
  const safeCreate = Math.min(creatingMsgIdx, Math.max(0, LOADING_MESSAGES.length - 1));
  const visiblePrepSteps = PREPARING_GRILL_STEPS.filter(
    (s) => hasGithub || !s.toLowerCase().includes("github"),
  );
  const safePrep = Math.min(preparingStepIdx, Math.max(0, visiblePrepSteps.length - 1));

  if (phase === "creating") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-8 gap-8 text-center">
        {/* Animated rings */}
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full border border-primary/10" />
          <div className="absolute inset-0 rounded-full border border-primary/25 border-t-primary animate-spin" style={{ animationDuration: "1.2s" }} />
          <div className="absolute inset-[5px] rounded-full border border-primary/10 border-t-primary/50 animate-spin" style={{ animationDuration: "0.9s", animationDirection: "reverse" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-2.5 rounded-full bg-primary/70 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-foreground/80">
            {LOADING_MESSAGES[safeCreate]}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground/30 uppercase tracking-widest">
            Creating workspace
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center py-8 px-6 gap-5 min-h-full">
      <div className="text-center mb-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/35 mb-1.5">
          Priming Grill-Me
        </p>
        <p className="text-[16px] font-semibold text-foreground/90 leading-snug">
          Thinking about your business
        </p>
        <p className="text-[12px] text-muted-foreground/45 mt-1.5 leading-relaxed max-w-[300px] mx-auto">
          Analysing what you provided so the interview starts exactly where it matters.
        </p>
      </div>

      <ol className="space-y-2.5">
        {visiblePrepSteps.map((label, i) => {
          const done = i < safePrep;
          const active = i === safePrep;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-[12px] leading-snug transition-all duration-300 ${
                done
                  ? "border-primary/20 bg-primary/[0.05] text-foreground/70"
                  : active
                  ? "border-white/[0.12] bg-white/[0.04] text-foreground/90"
                  : "border-white/[0.04] bg-transparent text-muted-foreground/30"
              }`}
            >
              <span className="shrink-0 size-4 flex items-center justify-center">
                {done ? (
                  <span className="text-primary text-[13px]">✓</span>
                ) : active ? (
                  <span className="size-2 rounded-full bg-primary/70 animate-pulse block" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/20 block" />
                )}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
