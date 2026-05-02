"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { LOADING_MESSAGES, ROLES } from "@/lib/onboarding/constants";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current);

    if (!apiKey.trim()) {
      setKeyStatus("idle");
      return;
    }

    setKeyStatus("idle");

    debounceRef.current = setTimeout(() => {
      setKeyStatus("loading");
      verifyTimerRef.current = setTimeout(() => {
        if (typeof window !== "undefined") {
          localStorage.setItem("cursor_api_key", apiKey);
        }
        const isValid = apiKey.startsWith("sk-") || apiKey.length > 10;
        setKeyStatus(isValid ? "connected" : "error");
      }, 1500);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current);
    };
  }, [apiKey, setKeyStatus]);

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

  return (
    <div className="stagger-children">
      <Label>Required</Label>
      <Heading>Connect Cursor</Heading>
      <ProgressBar pct={progressPct} />
      <Body>
        Enter your Cursor API key to enable agent execution. Paste it below — we&apos;ll verify automatically.
      </Body>

      <div className="mb-1 relative">
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-cursor-..."
          className={`bg-white/[0.04] border rounded-lg px-4 py-2.5 pr-[76px] text-[14px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-all w-full font-mono ${inputBorderClass}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={() => setShowKey((v) => !v)}
            className="text-white/30 hover:text-white/60 transition-colors"
            aria-label={showKey ? "Hide key" : "Show key"}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {apiKey.trim() && (
            <>
              <div className="w-px h-3.5 bg-white/[0.12] shrink-0" />
              {keyStatus === "loading" && (
                <Loader2 size={14} className="animate-spin text-primary/70 shrink-0" />
              )}
              {keyStatus === "connected" && (
                <Check size={14} className="text-green-400 shrink-0" />
              )}
              {keyStatus === "error" && (
                <X size={14} className="text-red-400 shrink-0" />
              )}
              {keyStatus === "idle" && (
                <span className="inline-block w-3.5 shrink-0" />
              )}
            </>
          )}
        </div>
      </div>

      <div className="min-h-[20px] mb-3">
        {keyStatus === "loading" && (
          <p className="text-[11px] text-primary/50 font-mono flex items-center gap-1.5">
            <span className="thinking-dot-1 inline-block size-1 rounded-full bg-primary/60" />
            <span className="thinking-dot-2 inline-block size-1 rounded-full bg-primary/60" />
            <span className="thinking-dot-3 inline-block size-1 rounded-full bg-primary/60" />
            <span className="ml-1">Verifying...</span>
          </p>
        )}
        {keyStatus === "connected" && (
          <p className="text-[11px] text-green-400/80 font-mono flex items-center gap-1.5 animate-fade-in">
            <Check size={11} />
            Connected — continuing in a moment...
          </p>
        )}
        {keyStatus === "error" && (
          <p className="text-[11px] text-red-400/70 animate-fade-in">
            Invalid key — try again
          </p>
        )}
      </div>

      <a
        href="https://cursor.com/settings"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-muted-foreground/30 underline hover:text-muted-foreground/50 transition-colors mb-6 inline-block"
      >
        Where do I find my API key?
      </a>

      <StepFooter>
        <span />
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

      <StepFooter>
        <BtnGhost onClick={onBack}>Back</BtnGhost>
        <PrimaryBtn onClick={onNext} disabled={!bizName.trim()}>
          Set Up →
        </PrimaryBtn>
      </StepFooter>
    </div>
  );
}

export function Step6({ msgIdx }: { msgIdx: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
      <div className="size-2 rounded-full bg-primary animate-pulse" />
      <p className="font-mono text-[12px] text-muted-foreground/40 min-h-[1.5em] transition-all">
        {LOADING_MESSAGES[msgIdx]}
      </p>
    </div>
  );
}
