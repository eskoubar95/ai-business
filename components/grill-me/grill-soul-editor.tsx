"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import {
  ArrowUp,
  ChevronDown,
  History,
  Loader2,
  MessageSquare,
  PanelRightOpen,
  X,
} from "lucide-react";

import { getGrillInterviewTranscript, saveBusinessSoulFromOnboarding } from "@/lib/grill-me/actions";
import type { ChatMessage } from "@/lib/onboarding/types";
import {
  clipAssistantTranscriptSnippet,
  extractSoulSubtitleLine,
  inferSectionConfidence,
  parseSoulDocTitle,
  parseSoulMarkdownSections,
  shortenNavTitle,
  type ParsedSoulSection,
  type SoulConfidence,
} from "@/lib/grill-me/soul-section-parser";
import { cn } from "@/lib/utils";

/** Client-safe mirror of server turn shape (avoid importing DB modules). */
type InterviewTurn = { id: string; role: "user" | "assistant"; content: string };

export type GrillSoulEditorProps = {
  businessId: string;
  bizName: string;
  soulMarkdown: string;
  setSoulMarkdown: Dispatch<SetStateAction<string>>;
  refinementMessages: ChatMessage[];
  editorInput: string;
  setEditorInput: Dispatch<SetStateAction<string>>;
  onRefinementSend: (quote?: string) => void;
  onDone: () => void | Promise<void>;
  doneLoading?: boolean;
  doneDisabled?: boolean;
};

const AUTO_SAVE_DEBOUNCE_MS = 2000;
const ADD_TO_CHAT_MIN_CHARS = 10;

function hmDa(d: Date): string {
  return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
}

function relDa(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 90) return "lige nu";
  if (s < 3600) return `for ${Math.floor(s / 60)} min. siden`;
  if (s < 86400) return `for ${Math.floor(s / 3600)} t. siden`;
  return `for ${Math.floor(s / 86400)} d. siden`;
}

function badgeForConfidence(c: SoulConfidence): { cls: string; label: string } {
  switch (c) {
    case "validated":
      return {
        cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/35",
        label: "✦ Valideret",
      };
    case "hypothesis":
      return {
        cls: "bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500/30",
        label: "◈ Hypotese",
      };
    default:
      return {
        cls: "bg-muted/80 text-muted-foreground ring-1 ring-border",
        label: "○ Ukendt",
      };
  }
}

function scrollTextAreaToByteIndex(ta: HTMLTextAreaElement, byteIdx: number) {
  const before = ta.value.slice(0, byteIdx);
  const lineStarts = before.split(/\n/).length;
  const lh = parseInt(globalThis.getComputedStyle(ta).lineHeight || "", 10) || 20;
  ta.scrollTop = Math.max(0, (lineStarts - 1) * lh - ta.clientHeight * 0.2);
  ta.focus({ preventScroll: true });
  ta.setSelectionRange(byteIdx, byteIdx);
}

export function GrillSoulEditor({
  businessId,
  bizName,
  soulMarkdown,
  setSoulMarkdown,
  refinementMessages,
  editorInput,
  setEditorInput,
  onRefinementSend,
  onDone,
  doneLoading,
  doneDisabled,
}: GrillSoulEditorProps) {
  const [interviewTurns, setInterviewTurns] = useState<InterviewTurn[] | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [rightMode, setRightMode] = useState<"refine" | "versions">("refine");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [savePhase, setSavePhase] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [savedAtHm, setSavedAtHm] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [snapshots, setSnapshots] = useState<
    { id: string; markdown: string; savedAt: number }[]
  >([]);

  const [versionPeek, setVersionPeek] = useState<{
    markdown: string;
    label: string;
  } | null>(null);

  const [quotedTexts, setQuotedTexts] = useState<string[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState("");
  const [pillPos, setPillPos] = useState<{ left: number; top: number } | null>(
    null,
    );
  const [activeSectionSlug, setActiveSectionSlug] = useState<string | null>(null);

  const saveSeqRef = useRef(0);
  const lastPersistedMarkdownRef = useRef<string>("");
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatTaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(
    () => parseSoulMarkdownSections(soulMarkdown),
    [soulMarkdown],
  );

  const docTitle = parseSoulDocTitle(soulMarkdown, bizName);

  const subtitle = extractSoulSubtitleLine(soulMarkdown);
  const metaLine =
    subtitle ??
    `Genereret af Grill-Me · ${new Date().toLocaleDateString("da-DK")}`;

  const persist = useCallback(
    async (md: string) => {
      const seq = ++saveSeqRef.current;
      setSavePhase("saving");
      setSaveErr(null);
      try {
        await saveBusinessSoulFromOnboarding(businessId, md);
        if (seq !== saveSeqRef.current) return;
        lastPersistedMarkdownRef.current = md;
        const at = Date.now();
        setSavePhase("saved");
        setSavedAtHm(hmDa(new Date(at)));
        setSnapshots((prev) => {
          if (prev[0]?.markdown === md) return prev;
          return [
            {
              id: crypto.randomUUID(),
              markdown: md,
              savedAt: at,
            },
            ...prev,
          ].slice(0, 40);
        });
      } catch (e) {
        if (seq !== saveSeqRef.current) return;
        setSavePhase("error");
        setSaveErr(
          e instanceof Error ? e.message : "Kunne ikke gemme — prøver igen…",
        );
      }
    },
    [businessId],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getGrillInterviewTranscript(businessId);
      if (cancelled) return;
      if (res.ok) setInterviewTurns(res.turns);
      setTranscriptLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rightMode, refinementMessages, interviewTurns]);

  /** Mark draft as diverged from last server save for topbar wording */
  useEffect(() => {
    if (
      lastPersistedMarkdownRef.current !== "" &&
      soulMarkdown !== lastPersistedMarkdownRef.current &&
      savePhase === "saved"
    ) {
      setSavePhase("idle");
    }
  }, [soulMarkdown, savePhase]);

  /** Debounced auto-save when markdown changes */
  useEffect(() => {
    const md = soulMarkdown.trim();
    if (!md) return;
    const t = setTimeout(() => {
      void persist(soulMarkdown);
    }, AUTO_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [soulMarkdown, persist]);

  /** Intersection Observer (preview mode) — active section in nav */
  useEffect(() => {
    if (!previewMode || sections.length === 0) return;
    const root = editorScrollRef.current;
    if (!root) return;
    const els = sections
      .map((s) => globalThis.document?.getElementById(s.slug))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (vis?.target?.id) setActiveSectionSlug(vis.target.id);
      },
      { root, rootMargin: "-20% 0px -65% 0px", threshold: [0.05, 0.24, 0.52] },
    );
    els.forEach((el) => obs.observe(el));
    setActiveSectionSlug(els[0]?.id ?? null);
    return () => obs.disconnect();
  }, [previewMode, soulMarkdown, sections]);

  /** Global shortcuts */
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        void persist(soulMarkdown);
      }
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        chatTaRef.current?.focus();
      }
      if (e.key === "Escape") {
        setPillPos(null);
        setSelectedSnippet("");
        setVersionPeek(null);
      }
    };
    globalThis.window?.addEventListener("keydown", kd);
    return () => globalThis.window?.removeEventListener("keydown", kd);
  }, [persist, soulMarkdown]);

  /** Document click hides selection pill */
  useEffect(() => {
    if (!pillPos) return;
    function down(ev: MouseEvent) {
      const t = ev.target as Node;
      const inPill =
        typeof (ev.target as HTMLElement).closest === "function" &&
        !!(ev.target as HTMLElement).closest?.("[data-add-to-chat-pill]");
      if (!(textareaRef.current?.contains(t) || inPill)) {
        setPillPos(null);
        setSelectedSnippet("");
      }
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [pillPos]);

  function captureSelection(forceClient?: { clientX: number; clientY: number }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const v = ta.value;
    const a = ta.selectionStart;
    const b = ta.selectionEnd;
    const slice = v.slice(a, b).trim();
    if (slice.length < ADD_TO_CHAT_MIN_CHARS) {
      setSelectedSnippet("");
      setPillPos(null);
      return;
    }
    setSelectedSnippet(slice);
    if (forceClient) {
      setPillPos({
        left: forceClient.clientX,
        top: forceClient.clientY + 10,
      });
      return;
    }
    /** Approximate caret row by counting newlines — pill near selection end */
    const before = v.slice(0, b).split("\n").length - 1;
    const lh = parseInt(globalThis.getComputedStyle(ta).lineHeight || "", 10) || 20;
    const rect = ta.getBoundingClientRect();
    setPillPos({
      left:
        rect.left + Math.min(rect.width - 140, ta.clientWidth / 3),
      top:
        rect.top + before * lh - ta.scrollTop + lh,
    });
  }

  function onNavActivate(s: ParsedSoulSection) {
    setMobileNavOpen(false);
    const ta = textareaRef.current;
    if (!previewMode) {
      if (ta) scrollTextAreaToByteIndex(ta, s.startOffset);
      setActiveSectionSlug(s.slug);
      return;
    }
    globalThis.document
      ?.getElementById(s.slug)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleAddSnippetToChat() {
    if (!selectedSnippet.trim()) return;
    setQuotedTexts((q) => [...q, selectedSnippet]);
    setPillPos(null);
    setSelectedSnippet("");
    setEditorInput("");
    chatTaRef.current?.focus();
    setMobileChatOpen(true);
  }

  function sendRefinement() {
    const t = editorInput.trim();
    if (!t) return;
    const quote = quotedTexts.length ? quotedTexts.join("\n\n—\n\n") : undefined;
    onRefinementSend(quote);
    setQuotedTexts([]);
    setSavePhase("idle");
  }

  const selectionPill =
    pillPos && selectedSnippet
      ? createPortal(
          <div
            data-add-to-chat-pill
            className="fixed z-[10002]"
            style={{
              left: pillPos.left,
              top: pillPos.top,
              transform: "translateX(-50%)",
              animation: "selectionBadgeIn 160ms ease-out forwards",
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              type="button"
              onClick={() => handleAddSnippetToChat()}
              className="flex items-center gap-2 rounded-full bg-zinc-900 px-3.5 py-1.5 text-[12px] font-medium text-white shadow-lg ring-1 ring-white/15 hover:bg-zinc-800"
            >
              <span className="text-white">+ Tilføj til chat</span>
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-background text-foreground">
      {/* Topbar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4 md:px-5">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <span
            className="size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            aria-hidden
          />
          <span className="truncate text-[14px] font-medium">{bizName}</span>
          <span className="hidden text-[12px] text-muted-foreground md:inline md:truncate md:max-w-[40vw]">
            {savePhase === "saving" && (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Gemmer…
              </span>
            )}
            {savePhase === "saved" && savedAtHm ? (
              <span>Gemt automatisk · {savedAtHm}</span>
            ) : savePhase === "idle" ? (
              <span>
                {savedAtHm
                  ? `Senest gemt kl. ${savedAtHm} — nye ændringer gemmes efter pause`
                  : "Autosave efter sidste pause (≈ 2 sek.)"}
              </span>
            ) : null}
            {savePhase === "error" && (
              <span className="text-amber-600 dark:text-amber-400">
                Kunne ikke gemme —{" "}
                {saveErr || "tryk ⌘S for at prøve igen"}
              </span>
            )}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <button
            type="button"
            className={cn(
              "hidden rounded-lg px-3 py-1.5 text-[12px] font-medium hover:bg-accent md:inline",
              previewMode ? "border border-emerald-500/40 bg-emerald-500/10" : "border border-border",
            )}
            onClick={() => setPreviewMode((p) => !p)}
          >
            {previewMode ? "Rediger markdown" : "Forhåndsvis"}
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-accent",
              rightMode === "versions" && "border-primary/45 bg-primary/10",
            )}
            onClick={() =>
              setRightMode((r) => (r === "versions" ? "refine" : "versions"))
            }
          >
            <History className="size-3.5" />
            Versioner
          </button>
          <button
            type="button"
            className="hidden rounded-full border border-emerald-500/40 bg-emerald-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 md:inline"
            disabled={doneDisabled || doneLoading}
            onClick={() => void onDone()}
          >
            {doneLoading ? "Gemmer…" : "Færdig →"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Mobile section dropdown */}
        <div className="flex border-b border-border px-3 py-2 md:hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-[12px]"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <span className="truncate">Sektioner</span>
            <ChevronDown
              className={cn("size-4 transition", mobileNavOpen && "rotate-180")}
            />
          </button>
        </div>
        {mobileNavOpen ? (
          <div className="absolute left-0 right-0 top-[calc(44px+44px)] z-[10001] mx-3 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover p-2 shadow-xl md:hidden">
            {(sections.length
              ? sections
              : [{ num: 0, title: "Hele dokument", slug: "doc-top", markdown: soulMarkdown, startOffset: 0, endOffset: soulMarkdown.length, confidence: inferSectionConfidence(soulMarkdown) } as ParsedSoulSection]
            ).map((sec) => {
              const b = badgeForConfidence(sec.confidence);
              return (
                <button
                  key={sec.slug + sec.title}
                  type="button"
                  className={cn(
                    "flex w-full flex-col rounded-md px-2 py-2 text-left text-[11px]",
                    activeSectionSlug === sec.slug && "bg-accent",
                  )}
                  onClick={() => {
                    if (!textareaRef.current) return;
                    const isWhole = sec.slug === "doc-top" || sec.num === 0;
                    if (isWhole) scrollTextAreaToByteIndex(textareaRef.current, 0);
                    else onNavActivate(sec);
                    setMobileNavOpen(false);
                  }}
                >
                  <span className="font-medium">
                    {sec.num ? `${sec.num}. ${shortenNavTitle(sec.title, 36)}` : sec.title}
                  </span>
                  <span className={cn("mt-0.5 w-fit rounded px-1 py-0.5 text-[9px]", b.cls)}>
                    {b.label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Section nav */}
        <nav className="hidden w-[108px] shrink-0 flex-col border-r border-border bg-muted/20 md:flex">
          <div className="flex-1 space-y-0.5 overflow-y-auto p-2 pt-4">
            {sections.length === 0 ? (
              <button
                type="button"
                className="w-full rounded-md px-1.5 py-1.5 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:bg-accent"
                onClick={() =>
                  textareaRef.current && scrollTextAreaToByteIndex(textareaRef.current, 0)
                }
              >
                Doc
              </button>
            ) : (
              sections.map((sec) => {
                const b = badgeForConfidence(sec.confidence);
                const active = activeSectionSlug === sec.slug;
                return (
                  <button
                    key={sec.slug}
                    type="button"
                    onClick={() => onNavActivate(sec)}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left transition",
                      active ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <div className="text-[11px] leading-tight">{sec.num}.</div>
                    <div className="text-[11px] leading-snug">{shortenNavTitle(sec.title, 18)}</div>
                    <div className={cn("mt-1 inline-block rounded px-1 py-px text-[8px]", b.cls)}>
                      {b.label}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </nav>

        {/* Editor center */}
        <main className="relative flex min-w-0 flex-1 flex-col border-r border-border">
          <div className="shrink-0 border-b border-border px-6 py-4">
            <p className="text-[17px] font-medium leading-snug">{docTitle}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{metaLine}</p>
          </div>

          {/* Mobile toolbar */}
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 md:hidden">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-center text-[12px]",
                previewMode ? "border-emerald-500/35 bg-emerald-500/10" : "",
              )}
              onClick={() => setPreviewMode((p) => !p)}
            >
              {previewMode ? "Rediger" : "Forhåndsvis"}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-45"
              disabled={doneDisabled || doneLoading}
              onClick={() => void onDone()}
            >
              {doneLoading ? "…" : "Færdig"}
            </button>
          </div>

          <div
            ref={editorScrollRef}
            className="relative min-h-0 flex-1 overflow-y-auto"
          >
            {selectionPill}

            {previewMode ? (
              <div className="space-y-6 px-6 py-6">
                {sections.length === 0 ? (
                  <div className="onboarding-prose text-[13px]">
                    <ReactMarkdown>{soulMarkdown || "_Tomt dokument_"}</ReactMarkdown>
                  </div>
                ) : (
                  sections.map((sec) => {
                    const b = badgeForConfidence(sec.confidence);
                    const thin =
                      sec.confidence === "unknown" && sec.markdown.length < 420;
                    return (
                      <section
                        key={sec.slug}
                        id={sec.slug}
                        className="rounded-xl border border-transparent px-4 py-3 transition hover:border-border hover:bg-muted/15"
                      >
                        <header className="mb-3 flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
                          <h2 className="text-[15px] font-semibold">
                            {sec.num}. {sec.title}
                          </h2>
                          <span className={cn("rounded-md px-2 py-0.5 text-[10px]", b.cls)}>
                            {b.label}
                          </span>
                        </header>
                        <div className="onboarding-prose text-[12px] leading-relaxed">
                          <ReactMarkdown>{sec.markdown.replace(/^##\s+\d+\.\s+.+\n+/, "").trim() || "_—_"}</ReactMarkdown>
                        </div>
                        {thin ? (
                          <p className="mt-3 text-[11px] text-muted-foreground">
                            Denne sektion blev ikke fuldt dækket under interviewet.{" "}
                            <button
                              type="button"
                              className="text-emerald-600 underline decoration-emerald-500/40 hover:no-underline dark:text-emerald-400"
                              onClick={() => {
                                chatTaRef.current?.focus();
                                setEditorInput(
                                  `Hjælp mig med at udfylde sektionen om ${sec.title}`,
                                );
                                setMobileChatOpen(true);
                              }}
                            >
                              Udfyld via side-chat →
                            </button>
                          </p>
                        ) : null}
                      </section>
                    );
                  })
                )}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                spellCheck={false}
                value={soulMarkdown}
                onMouseUp={(ev) => {
                  const ta = textareaRef.current;
                  if (!ta) return;
                  const sel =
                    ta.selectionEnd -
                    ta.selectionStart;
                  if (sel >= ADD_TO_CHAT_MIN_CHARS) {
                    captureSelection({
                      clientX: ev.clientX,
                      clientY: ev.clientY,
                    });
                  } else {
                    setPillPos(null);
                    setSelectedSnippet("");
                  }
                }}
                onSelect={() =>
                  textareaRef.current &&
                  textareaRef.current.selectionEnd -
                    textareaRef.current.selectionStart <
                    ADD_TO_CHAT_MIN_CHARS
                  ? (setPillPos(null), setSelectedSnippet(""), undefined as void)
                  : undefined}
                onMouseDown={() => {
                  setPillPos(null);
                  setSelectedSnippet("");
                }}
                onChange={(e) => setSoulMarkdown(e.target.value)}
                placeholder="Soul Document (markdown)"
                className="min-h-[60vh] w-full resize-none bg-transparent px-6 py-5 font-mono text-[12px] leading-relaxed outline-none md:min-h-0 md:h-full"
              />
            )}
          </div>

          {/* Version peek overlay */}
          {versionPeek ? (
            <div className="absolute inset-0 z-[10003] flex flex-col bg-black/55 backdrop-blur-[2px]">
              <div className="m-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <header className="flex items-center justify-between border-b border-border px-4 py-2">
                  <span className="text-[13px] font-medium">{versionPeek.label}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1 text-[12px] hover:bg-muted"
                      onClick={() => setVersionPeek(null)}
                    >
                      Luk
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-emerald-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-emerald-700"
                      onClick={() => {
                        setSoulMarkdown(versionPeek.markdown);
                        setVersionPeek(null);
                      }}
                    >
                      Gendan denne version
                    </button>
                  </div>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                  <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {versionPeek.markdown}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </main>

        {/* Desktop side panel */}
        <aside className="hidden w-[220px] shrink-0 flex-col md:flex">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
            {rightMode === "refine" ? (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Side-chat
                </span>
                <PanelRightOpen className="size-3 text-muted-foreground" />
              </>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Historik (auto-save)
              </span>
            )}
          </div>

          {rightMode === "versions" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-1 overflow-y-auto p-3 text-[11px]">
                {snapshots.length === 0 ? (
                  <p className="text-muted-foreground">
                    Snapshot oprettes efter første automatisk gem.
                  </p>
                ) : (
                  snapshots.map((sn, idx) => (
                    <div key={sn.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setVersionPeek({
                            markdown: sn.markdown,
                            label:
                              idx === 0 ? `● v.${snapshots.length - idx} (${relDa(sn.savedAt)})` : `v.${snapshots.length - idx} · ${relDa(sn.savedAt)}`,
                          })
                        }
                        className={cn(
                          "w-full rounded-lg border px-2 py-2 text-left hover:bg-accent",
                          idx === 0 ? "border-emerald-500/40 bg-emerald-500/5" : "border-transparent",
                        )}
                      >
                        {idx === 0 ? "● Nu (sidst gemt)" : `v.${snapshots.length - idx}`}{" "}
                        · {hmDa(new Date(sn.savedAt))}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
                <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  Grill-Me interview (arkiv)
                </p>
                {transcriptLoading ? (
                  <p className="text-[11px] text-muted-foreground">Henter samtale…</p>
                ) : interviewTurns && interviewTurns.length ? (
                  interviewTurns.map((t) =>
                    t.role === "assistant" ? (
                      <div
                        key={t.id}
                        className="rounded-lg bg-muted/40 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground opacity-85"
                      >
                        {clipAssistantTranscriptSnippet(t.content)}
                      </div>
                    ) : (
                      <div
                        key={t.id}
                        className="ml-1 border-l border-border py-1 pl-2 text-[11px]"
                      >
                        {t.content}
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-[11px] text-muted-foreground">Ingen rækker endnu.</p>
                )}
                <div className="my-2 border-t border-dashed border-border pt-2">
                  <p className="text-[9px] text-muted-foreground">
                    Interview afsluttet — fortsæt her
                  </p>
                </div>
                {refinementMessages.map((m, i) => (
                  <div key={i} className={cn(m.role === "ai" ? "opacity-95" : "")}>
                    {m.role === "ai" ? (
                      <div className="rounded-lg bg-muted/55 px-2.5 py-2 text-[11px] text-muted-foreground">
                        {m.content}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {m.quote ? (
                          <div className="border-l-[3px] border-emerald-500 bg-emerald-500/15 px-2 py-1.5 text-[10px] italic text-foreground">
                            <span aria-hidden>{`▌ «`}</span>
                            {m.quote.length > 200 ? `${m.quote.slice(0, 200)}…` : m.quote}
                            <span aria-hidden>{`»`}</span>
                          </div>
                        ) : null}
                        <div className="text-[11px] text-foreground">{m.content}</div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="shrink-0 space-y-2 border-t border-border p-3">
                {quotedTexts.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground">
                      Udvalgte uddrag til næste besked
                    </p>
                    {quotedTexts.map((q, qi) => (
                      <div
                        key={qi}
                        className="relative flex rounded-lg border border-emerald-800/35 bg-emerald-950/20 px-2 py-1.5"
                      >
                        <p className="text-[10px] leading-snug text-emerald-100/90 italic">
                          {q.slice(0, 120)}
                          {q.length > 120 ? "…" : ""}
                        </p>
                        <button
                          type="button"
                          className="absolute right-1 top-1 text-muted-foreground hover:text-foreground"
                          aria-label="Fjern"
                          onClick={() =>
                            setQuotedTexts((qs) => qs.filter((_, j) => j !== qi))
                          }
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <textarea
                  ref={chatTaRef}
                  rows={3}
                  value={editorInput}
                  placeholder={
                    quotedTexts.length
                      ? "Hvad vil du ændre eller uddybe?"
                      : "Fortsæt eller stil et spørgsmål…"
                  }
                  onChange={(e) => setEditorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendRefinement();
                    }
                  }}
                  className="h-[60px] w-full resize-none rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-[12px] outline-none placeholder:text-muted-foreground/60 focus:border-primary/40"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={!editorInput.trim()}
                    onClick={sendRefinement}
                    className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-35"
                    aria-label="Send"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Floating mobile chat FAB */}
      <button
        type="button"
        className={cn(
          "fixed bottom-5 right-4 z-[9999] flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-opacity md:hidden",
          mobileChatOpen && "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileChatOpen(true)}
      >
        <MessageSquare className="size-6" />
      </button>

      {mobileChatOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-[9998] max-h-[70vh] rounded-t-2xl border border-border bg-card shadow-2xl md:hidden flex flex-col">
          <header className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-[13px] font-medium">Side-chat</span>
            <button
              type="button"
              aria-label="Luk"
              onClick={() => setMobileChatOpen(false)}
              className="rounded-md p-1 hover:bg-accent"
            >
              <ChevronDown className="size-5 rotate-[-90deg]" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 text-[11px]">
            {interviewTurns?.map((t) => (
              <div
                key={t.id + "m"}
                className={cn(
                  "mb-2 rounded-md px-2 py-1.5 text-muted-foreground",
                  t.role === "assistant" ? "bg-muted/40 opacity-85" : "border-l-2 border-border bg-transparent opacity-95",
                )}
              >
                {t.role === "assistant"
                  ? clipAssistantTranscriptSnippet(t.content, 380)
                  : t.content}
              </div>
            ))}
            <p className="my-2 text-[10px] text-muted-foreground">— Forsættelse —</p>
            {refinementMessages.map((m, i) => (
              <div key={i} className="mb-2">
                {m.role === "user" ? (
                  <div>{m.content}</div>
                ) : (
                  <div className="rounded-md bg-muted/50">{m.content}</div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t p-3">
            <textarea
              rows={2}
              value={editorInput}
              onChange={(e) => setEditorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendRefinement();
                }
              }}
              placeholder="Skriv besked…"
              className="mb-2 w-full resize-none rounded-lg border px-2 py-2 text-[12px]"
            />
            <button
              type="button"
              className="w-full rounded-lg bg-primary py-2 text-[13px] text-primary-foreground"
              onClick={() => {
                sendRefinement();
              }}
            >
              Send
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
