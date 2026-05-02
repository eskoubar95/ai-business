"use client";

import { type Dispatch, type SetStateAction } from "react";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/40 mb-3">
      {children}
    </p>
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[28px] font-semibold leading-tight text-foreground mb-2">
      {children}
    </h1>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] text-muted-foreground/60 leading-relaxed mb-6">{children}</p>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-[2px] bg-white/[0.07] rounded-full overflow-hidden mb-5 mt-1">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-white/[0.04] border border-border rounded-lg px-4 py-2.5 text-[14px] text-foreground focus:outline-none focus:border-primary/50 transition-all w-full placeholder:text-muted-foreground/30 ${className}`}
    />
  );
}

export function PrimaryBtn({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
  "aria-busy": ariaBusy,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  "aria-busy"?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-busy={ariaBusy === true ? true : undefined}
      className={`group relative flex h-9 items-center gap-1.5 rounded-lg px-5 text-[13px] font-medium text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        border: "1px solid transparent",
        background:
          "linear-gradient(#141414, #141414) padding-box, linear-gradient(135deg, rgba(168,235,18,0.8) 0%, rgba(80,140,0,0.5) 100%) border-box",
      }}
    >
      <span
        className="absolute inset-0 rounded-lg transition-opacity duration-200"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,235,18,0.18) 0%, rgba(80,140,0,0.08) 100%)",
        }}
      />
      <span
        className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,235,18,0.28) 0%, rgba(80,140,0,0.14) 100%)",
        }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}

export function BtnGhost({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white/[0.05] border border-border text-foreground/70 rounded-lg px-5 py-2 text-[13px] hover:bg-white/[0.08] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

export function StepFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 mt-6">{children}</div>;
}
