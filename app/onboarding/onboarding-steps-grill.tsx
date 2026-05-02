"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowUp,
  MessageSquarePlus,
  X,
} from "lucide-react";
import type { ChatMessage } from "@/lib/onboarding/types";
import ReactMarkdown from "react-markdown";
import type { ReactNode } from "react";

import { Heading, Label, PrimaryBtn } from "./onboarding-steps-ui";

function Step7Editor({
  bizName,
  soulMarkdown,
  setSoulMarkdown,
  editorMessages,
  editorInput,
  setEditorInput,
  onEditorSend,
  onContinue,
  continueDisabled,
  continueLoading,
}: {
  bizName: string;
  soulMarkdown: string;
  setSoulMarkdown: Dispatch<SetStateAction<string>>;
  editorMessages: ChatMessage[];
  editorInput: string;
  setEditorInput: Dispatch<SetStateAction<string>>;
  onEditorSend: (quote?: string) => void;
  onContinue: () => void | Promise<void>;
  continueDisabled?: boolean;
  continueLoading?: boolean;
}) {
  const [selectedText, setSelectedText] = useState("");
  const [quotedTexts, setQuotedTexts] = useState<string[]>([]);
  const [selectionBadgePos, setSelectionBadgePos] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const editorMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    editorMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [editorMessages]);

  useEffect(() => {
    if (!selectionBadgePos) return;
    function handleDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const insideBadge = badgeRef.current?.contains(target);
      const insideEditor = editorRef.current?.contains(target);
      if (!insideBadge && !insideEditor) {
        setSelectionBadgePos(null);
        setSelectedText("");
      }
    }
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, [selectionBadgePos]);

  function readSelection(clientX?: number, clientY?: number) {
    const ta = editorRef.current;
    if (!ta) return;
    const text = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
    if (text) {
      setSelectedText(text);
      if (clientX !== undefined && clientY !== undefined) {
        setSelectionBadgePos({ x: clientX, y: clientY - 48 });
      } else {
        const rect = ta.getBoundingClientRect();
        setSelectionBadgePos({ x: rect.left + rect.width / 2, y: rect.top + 36 });
      }
    } else {
      setSelectedText("");
      setSelectionBadgePos(null);
    }
  }

  function handleAddToChat() {
    if (!selectedText) return;
    setQuotedTexts((prev) => [...prev, selectedText]);
    setSelectionBadgePos(null);
    setSelectedText("");
    setTimeout(() => chatInputRef.current?.focus(), 50);
  }

  function handleSend() {
    if (!editorInput.trim()) return;
    const quote = quotedTexts.length > 0 ? quotedTexts.join("\n---\n") : undefined;
    onEditorSend(quote);
    setQuotedTexts([]);
  }

  const selectionBadge =
    mounted && selectionBadgePos && selectedText
      ? createPortal(
          <div
            ref={badgeRef}
            style={{
              position: "fixed",
              left: selectionBadgePos.x,
              top: selectionBadgePos.y,
              transform: "translateX(-50%)",
              zIndex: 9999,
              animation: "selectionBadgeIn 100ms ease-out forwards",
            }}
            className="flex items-center gap-1.5 bg-popover border border-border rounded-full px-3 py-1.5 shadow-xl shadow-black/40 cursor-pointer select-none"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAddToChat}
          >
            <MessageSquarePlus size={11} className="text-white/50 shrink-0" />
            <span className="text-[11px] text-white/70 font-medium whitespace-nowrap">Add to chat</span>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="flex h-[620px]">
      {selectionBadge}

      <div className="flex-1 flex flex-col border-r border-white/[0.06] min-w-0">
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/20">Business Soul</p>
          <p className="text-[12px] text-white/35 mt-0.5">Edit your profile — select any text to add to chat</p>
        </div>
        <textarea
          ref={editorRef}
          value={soulMarkdown}
          onChange={(e) => setSoulMarkdown(e.target.value)}
          onMouseUp={(e) => readSelection(e.clientX, e.clientY)}
          onKeyUp={() => readSelection()}
          onMouseDown={() => {
            setSelectionBadgePos(null);
            setSelectedText("");
          }}
          className="flex-1 resize-none bg-transparent px-6 py-5 text-[13px] text-foreground/75 font-mono leading-relaxed focus:outline-none"
          spellCheck={false}
        />
      </div>

      <div className="w-[280px] shrink-0 flex flex-col">
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/20">AI Assistant</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {editorMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
              {m.role === "ai" ? (
                <div className="flex items-start gap-2 max-w-[95%]">
                  <span className="mt-0.5 shrink-0 rounded bg-primary/10 text-primary text-[9px] font-mono font-semibold px-1.5 py-0.5 tracking-wider">
                    AI
                  </span>
                  <p className="text-[12px] text-foreground/60 leading-relaxed">{m.content}</p>
                </div>
              ) : (
                <div className="bg-white/[0.05] rounded-xl px-3 py-2 text-[12px] text-foreground max-w-[90%] leading-relaxed">
                  {m.quote && (
                    <div className="border-l-2 border-primary/60 bg-white/[0.03] rounded px-2 py-1.5 text-[11px] text-white/50 italic mb-2">
                      {m.quote.length > 80 ? `${m.quote.slice(0, 80)}…` : m.quote}
                    </div>
                  )}
                  {m.content}
                </div>
              )}
            </div>
          ))}
          <div ref={editorMessagesEndRef} />
        </div>
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.05] shrink-0 space-y-2">
          {quotedTexts.length > 0 && (
            <div className="space-y-1">
              {quotedTexts.map((qt, i) => (
                <div key={i} className="flex items-start gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 animate-fade-in">
                  <div className="border-l-2 border-primary/60 pl-2 flex-1 min-w-0">
                    <p className="text-[11px] text-white/50 italic truncate">
                      {qt.length > 80 ? `${qt.slice(0, 80)}…` : qt}
                    </p>
                  </div>
                  <button
                    onClick={() => setQuotedTexts((prev) => prev.filter((_, j) => j !== i))}
                    className="shrink-0 text-white/25 hover:text-white/60 transition-colors mt-0.5"
                    aria-label="Remove quote"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={chatInputRef}
              type="text"
              value={editorInput}
              onChange={(e) => setEditorInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={quotedTexts.length > 0 ? "Add a message…" : "Message AI..."}
              className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] text-foreground placeholder:text-white/20 w-full focus:outline-none focus:border-primary/40 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!editorInput.trim()}
              className="shrink-0 size-8 rounded-full bg-primary flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-30"
            >
              <ArrowUp size={13} className="text-white" />
            </button>
          </div>
          <PrimaryBtn
            onClick={() => void onContinue()}
            disabled={continueDisabled || continueLoading}
            className="w-full justify-center"
          >
            {continueLoading ? "Saving…" : "Enter workspace →"}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

export function Step7({
  bizName,
  chatPhase,
  grillChatPhase,
  onProceedToSoulEditor,
  canProceedFromChat,
  editorMessages,
  editorInput,
  setEditorInput,
  onEditorSend,
  soulMarkdownDraft,
  setSoulMarkdownDraft,
  onFinalizeEditorToDashboard,
  editorContinueLoading,
}: {
  bizName: string;
  chatPhase: "chat" | "editor";
  grillChatPhase: ReactNode;
  onProceedToSoulEditor: () => void;
  canProceedFromChat: boolean;
  editorMessages: ChatMessage[];
  editorInput: string;
  setEditorInput: Dispatch<SetStateAction<string>>;
  onEditorSend: (quote?: string) => void;
  soulMarkdownDraft: string;
  setSoulMarkdownDraft: Dispatch<SetStateAction<string>>;
  onFinalizeEditorToDashboard: () => Promise<void>;
  editorContinueLoading?: boolean;
}) {
  if (chatPhase === "editor") {
    return (
      <Step7Editor
        bizName={bizName}
        soulMarkdown={soulMarkdownDraft}
        setSoulMarkdown={setSoulMarkdownDraft}
        editorMessages={editorMessages}
        editorInput={editorInput}
        setEditorInput={setEditorInput}
        onEditorSend={onEditorSend}
        onContinue={() => void onFinalizeEditorToDashboard()}
        continueDisabled={!soulMarkdownDraft.trim()}
        continueLoading={editorContinueLoading}
      />
    );
  }

  return (
    <div className="flex h-[620px] flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/[0.06] px-6 pt-6 pb-4">
        <Label>Grill Me</Label>
        <h2 className="text-[18px] font-semibold text-foreground leading-tight">
          Tell us about your business
        </h2>
        <p className="mt-1 text-[12px] text-muted-foreground/60">
          Same agent flow as dashboard Grill-Me. Keep going until your soul file is saved below, then
          review and edit.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">{grillChatPhase}</div>

      <div className="shrink-0 border-t border-white/[0.05] px-6 py-4">
        {!canProceedFromChat ? (
          <p className="text-[12px] text-muted-foreground/50">
            Answer the assistant&apos;s questions until you see &quot;Soul file saved&quot;. Then continue
            to the editor.
          </p>
        ) : (
          <div className="flex justify-end">
            <PrimaryBtn onClick={onProceedToSoulEditor} className="px-6">
              Review / edit soul →
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
      <Heading>Here&apos;s what we captured.</Heading>
      <p className="text-[14px] text-muted-foreground/60 leading-relaxed mb-6">
        This profile is stored for <span className="text-foreground/80">{bizName || "your business"}</span> and is
        injected into agent runs.
      </p>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-6 py-5 mb-8 max-h-[min(48vh,440px)] overflow-y-auto">
        {md ? (
          <div className="onboarding-prose text-[13px] leading-relaxed text-foreground/85">
            <ReactMarkdown>{md}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground/50">
            No soul markdown found — go back and complete the Grill-Me chat.
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <PrimaryBtn onClick={onEnter} className="px-8 py-3 text-[15px]">
          Enter your workspace →
        </PrimaryBtn>
      </div>
    </div>
  );
}
