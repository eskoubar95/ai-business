"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  FieldSelect,
  SectionDivider,
} from "@/components/agents/agent-settings-form-fields-part";
import { cn } from "@/lib/utils";

const ADAPTERS = [
  { id: "cursor_cli", label: "Cursor CLI" },
  { id: "hermes", label: "Hermes Agent" },
  { id: "multi", label: "Multi-agent" },
] as const;

export type AgentAdapterId = (typeof ADAPTERS)[number]["id"];

const MODELS = [
  { id: "auto", label: "Auto" },
  { id: "claude-opus-4", label: "Claude Opus 4" },
  { id: "claude-sonnet-4", label: "Claude Sonnet 4" },
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

const THINKING_EFFORTS = [
  { id: "auto", label: "Auto" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

type Props = {
  adapter: AgentAdapterId;
  setAdapter: (id: AgentAdapterId) => void;
  model: string;
  setModel: (v: string) => void;
  thinkingEffort: string;
  setThinkingEffort: (v: string) => void;
  heartbeatEnabled: boolean;
  setHeartbeatEnabled: Dispatch<SetStateAction<boolean>>;
  heartbeatInterval: string;
  setHeartbeatInterval: (v: string) => void;
};

export function AgentSettingsAdapterRunPolicySections({
  adapter,
  setAdapter,
  model,
  setModel,
  thinkingEffort,
  setThinkingEffort,
  heartbeatEnabled,
  setHeartbeatEnabled,
  heartbeatInterval,
  setHeartbeatInterval,
}: Props) {
  return (
    <>
      <SectionDivider label="Adapter" />

      <div className="mb-4 flex flex-col gap-1.5">
        <p className="section-label">Adapter type</p>
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          {ADAPTERS.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAdapter(a.id)}
              className={cn(
                "flex-1 cursor-pointer px-4 py-2 text-[12px] font-medium transition-colors",
                i > 0 ? "border-l border-white/[0.07]" : "",
                adapter === a.id
                  ? "bg-white/[0.08] text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
        {adapter === "multi" && (
          <p className="text-[11px] text-muted-foreground/40 leading-snug mt-1">
            The agent selects the best adapter per task automatically.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <FieldSelect
          id="model"
          label="Model"
          value={model}
          onChange={setModel}
          options={MODELS}
        />
        <FieldSelect
          id="thinking-effort"
          label="Thinking effort"
          value={thinkingEffort}
          onChange={setThinkingEffort}
          options={THINKING_EFFORTS}
        />
      </div>

      <SectionDivider label="Run Policy" />

      <div className="mb-4 rounded-md border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[13px] font-medium text-foreground">Heartbeat on interval</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/50">
              Automatically wake this agent on a schedule
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={heartbeatEnabled}
            onClick={() => setHeartbeatEnabled((v) => !v)}
            className={cn(
              "relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
              "transition-colors duration-200",
              heartbeatEnabled ? "bg-primary" : "bg-white/[0.14]",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block size-[14px] rounded-full bg-white shadow ring-0 transition-transform duration-200",
                heartbeatEnabled ? "translate-x-[14px]" : "translate-x-0",
              )}
            />
          </button>
        </div>

        {heartbeatEnabled && (
          <div className="border-t border-white/[0.06] px-4 py-3 bg-white/[0.015]">
            <p className="section-label mb-2">Interval (minutes)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="1440"
                value={heartbeatInterval}
                onChange={(e) => setHeartbeatInterval(e.target.value)}
                className={cn(
                  "h-8 w-24 rounded-md border border-border bg-transparent",
                  "px-3 text-[13px] text-foreground",
                  "outline-none transition-colors focus:border-white/[0.18]",
                )}
              />
              <span className="text-[12px] text-muted-foreground/50">minutes</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
