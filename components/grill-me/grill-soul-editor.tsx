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
import {
  ArrowUp,
  ChevronDown,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  History,
  Loader2,
  MessageSquare,
  RotateCcw,
  X,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { getGrillInterviewTranscript, saveBusinessSoulFromOnboarding } from "@/lib/grill-me/actions";
import {
  splitAssistantBodyAndQuickReplies,
  type GrillQuickReply,
} from "@/lib/grill-me/extract-quick-replies";
import type { ChatMessage } from "@/lib/onboarding/types";
import {
  clipAssistantTranscriptSnippet,
  decodeSoulNavTitle,
  extractSoulSubtitleLine,
  parseSoulDocTitle,
  parseSoulMarkdownSections,
  shortenNavTitle,
  type ParsedSoulSection,
  type SoulConfidence,
} from "@/lib/grill-me/soul-section-parser";
import { normalizeSoulMarkdownForEditor } from "@/lib/grill-me/soul-markdown-normalize";
import { cn } from "@/lib/utils";
import { SoulMarkdownDocumentEditor } from "@/components/grill-me/soul-section-tiptap-editor";

export type GrillSoulEditorProps = {
  businessId: string;
  bizName: string;
  soulMarkdown: string;
  setSoulMarkdown: Dispatch<SetStateAction<string>>;
  refinementMessages: ChatMessage[];
  editorInput: string;
  setEditorInput: Dispatch<SetStateAction<string>>;
  onRefinementSend: (quote?: string, forcedUserMessage?: string) => void;
  refinementBusy?: boolean;
  /** First paint while loading proactive opening guidance (no messages yet). */
  openingGuidanceLoading?: boolean;
  onDone: () => void | Promise<void>;
  doneLoading?: boolean;
  doneDisabled?: boolean;
};

const AUTO_SAVE_DEBOUNCE_MS = 2000;

/** Soul refine panel: longer labels on stacked quick-reply buttons (still capped to avoid huge DOM). */
const REFINE_QUICK_REPLY_LABEL_CAP = 380;

/** Sticky title row + air so `h2` anchors are not hidden when scrolling */
const SOUL_DOC_STICKY_SCROLL_PADDING_PX = 96;

function scrollSoulSectionIntoView(
  scrollRoot: HTMLElement | null,
  sec: ParsedSoulSection,
  behavior: ScrollBehavior = "smooth",
): void {
  if (typeof document === "undefined" || !scrollRoot) return;

  const locateElement = (): HTMLElement | null => {
    const byId = document.getElementById(sec.slug);
    if (byId) return byId;
    const pm = scrollRoot.querySelector(".ProseMirror");
    if (!pm) return null;
    const reNum = new RegExp(`^\\s*(${sec.num}|${String(sec.num).padStart(2, "0")})\\.\\s*`, "i");
    for (const sel of ["h1", "h2", "h3"]) {
      for (const h of pm.querySelectorAll(sel)) {
        if (!(h instanceof HTMLElement)) continue;
        const t = h.textContent?.replace(/\u00a0/g, " ").trim() ?? "";
        if (!reNum.test(t)) continue;
        h.id = sec.slug;
        return h;
      }
    }
    return null;
  };

  const el = locateElement();
  if (!el) return;
  const elTop = el.getBoundingClientRect().top;
  const rootTop = scrollRoot.getBoundingClientRect().top;
  const nextTop = scrollRoot.scrollTop + (elTop - rootTop) - SOUL_DOC_STICKY_SCROLL_PADDING_PX;
  scrollRoot.scrollTo({ top: Math.max(0, nextTop), behavior });
}

function hmDa(d: Date): string {
  return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
}

function relDa(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

function ConfidencePill({ c }: { c: SoulConfidence }) {
  if (c === "validated")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25">
        <CheckCircle2 className="size-2.5" />
        Validated
      </span>
    );
  if (c === "hypothesis")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25">
        <CircleDot className="size-2.5" />
        Hypothesis
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
      <CircleDashed className="size-2.5" />
      Unknown
    </span>
  );
}

type InterviewTurn = { id: string; role: "user" | "assistant"; content: string };

function RefinementAssistantMarkdown({ markdown }: { markdown: string }) {
  if (!markdown.trim()) return null;
  return (
    <div
      className={cn(
        "prose prose-sm prose-invert max-w-none leading-relaxed text-foreground/85",
        "[&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5",
        "[&_strong]:text-foreground/95 [&_code]:rounded [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[11px]",
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{markdown.trim()}</Markdown>
    </div>
  );
}

function RefinementQuickReplies({
  replies,
  disabled,
  onPick,
  onFocusFreeform,
}: {
  replies: GrillQuickReply[];
  disabled: boolean;
  onPick: (value: string) => void;
  onFocusFreeform?: () => void;
}) {
  if (replies.length === 0) return null;
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5" role="group" aria-label="Hurtigsvar">
      {replies.map((r) => (
        <button
          key={r.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(r.value)}
          className={cn(
            "w-full min-w-0 cursor-pointer rounded-xl border border-white/[0.1] bg-white/[0.04]",
            "px-3 py-2 text-left text-[11px] font-medium leading-snug text-foreground/80 transition-all",
            "whitespace-normal [overflow-wrap:anywhere] hover:border-primary/40 hover:bg-primary/[0.07] hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-30",
          )}
        >
          {r.label}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onFocusFreeform?.()}
        className={cn(
          "w-full rounded-xl border border-dashed border-white/[0.1] px-3 py-2 text-left text-[11px] text-muted-foreground/50 transition-all",
          "hover:border-white/[0.18] hover:text-muted-foreground/75 disabled:pointer-events-none disabled:opacity-30 cursor-pointer",
        )}
      >
        Andet — skriv herunder
      </button>
    </div>
  );
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
  refinementBusy = false,
  openingGuidanceLoading = false,
  onDone,
  doneLoading,
  doneDisabled,
}: GrillSoulEditorProps) {
  const [interviewTurns, setInterviewTurns] = useState<InterviewTurn[] | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [rightMode, setRightMode] = useState<"refine" | "versions">("refine");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [savePhase, setSavePhase] = useState<"idle" | "saving" | "saved" | "error">("idle");
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
  const [activeSectionSlug, setActiveSectionSlug] = useState<string | null>(null);

  const saveSeqRef = useRef(0);
  const lastPersistedMarkdownRef = useRef<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatTaRef = useRef<HTMLTextAreaElement>(null);
  const mobileChatTaRef = useRef<HTMLTextAreaElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  const scrollToSoulSection = useCallback((sec: ParsedSoulSection) => {
    const root = editorScrollRef.current;
    const run = () => {
      scrollSoulSectionIntoView(root, sec);
      setActiveSectionSlug(sec.slug);
    };
    run();
    requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
  }, []);

  const soulMarkdownForEditor = useMemo(
    () => normalizeSoulMarkdownForEditor(soulMarkdown),
    [soulMarkdown],
  );

  useEffect(() => {
    if (soulMarkdownForEditor !== soulMarkdown) {
      setSoulMarkdown(soulMarkdownForEditor);
    }
  }, [soulMarkdownForEditor, soulMarkdown, setSoulMarkdown]);

  const sections = useMemo(
    () => parseSoulMarkdownSections(soulMarkdownForEditor),
    [soulMarkdownForEditor],
  );

  const refinementQuickReplies = useMemo(() => {
    if (refinementBusy || openingGuidanceLoading) return [];
    const last = refinementMessages[refinementMessages.length - 1];
    if (!last || last.role !== "ai") return [];
    return splitAssistantBodyAndQuickReplies(last.content, {
      maxChipLabelLength: REFINE_QUICK_REPLY_LABEL_CAP,
    }).quickReplies;
  }, [refinementMessages, refinementBusy, openingGuidanceLoading]);

  const docTitle = parseSoulDocTitle(soulMarkdownForEditor, bizName);
  const subtitle = extractSoulSubtitleLine(soulMarkdownForEditor);
  const metaLine =
    subtitle ?? `Generated by Grill-Me · ${new Date().toLocaleDateString("en-GB")}`;

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
          return [{ id: crypto.randomUUID(), markdown: md, savedAt: at }, ...prev].slice(0, 40);
        });
      } catch (e) {
        if (seq !== saveSeqRef.current) return;
        setSavePhase("error");
        setSaveErr(e instanceof Error ? e.message : "Save failed");
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
    return () => { cancelled = true; };
  }, [businessId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rightMode, refinementMessages, interviewTurns, refinementBusy, openingGuidanceLoading]);

  useEffect(() => {
    if (
      lastPersistedMarkdownRef.current !== "" &&
      soulMarkdown !== lastPersistedMarkdownRef.current &&
      savePhase === "saved"
    ) {
      setSavePhase("idle");
    }
  }, [soulMarkdown, savePhase]);

  useEffect(() => {
    const md = soulMarkdown.trim();
    if (!md) return;
    const t = setTimeout(() => void persist(soulMarkdown), AUTO_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [soulMarkdown, persist]);

  // Scroll-spy for active section
  useEffect(() => {
    const root = editorScrollRef.current;
    if (!root || sections.length === 0) return;
    const els = sections
      .map((s) => document.getElementById(s.slug))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (vis?.target?.id) setActiveSectionSlug(vis.target.id);
      },
      { root, rootMargin: "-15% 0px -60% 0px", threshold: [0.05, 0.25, 0.5] },
    );
    els.forEach((el) => obs.observe(el));
    setActiveSectionSlug(els[0]?.id ?? null);
    return () => obs.disconnect();
  }, [soulMarkdown, sections]);

  // Global shortcuts
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") { e.preventDefault(); void persist(soulMarkdown); }
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); chatTaRef.current?.focus(); }
      if (e.key === "Escape") {
        setVersionPeek(null);
      }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, [persist, soulMarkdown]);

  function sendRefinement(forcedUserMessage?: string) {
    const t = (forcedUserMessage ?? editorInput).trim();
    if (!t || refinementBusy || openingGuidanceLoading) return;
    const quote = quotedTexts.length ? quotedTexts.join("\n\n—\n\n") : undefined;
    onRefinementSend(quote, forcedUserMessage);
    setQuotedTexts([]);
  }

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-[#0f0f0f] text-foreground">

      {/* ── Topbar ── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0f0f0f] px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
              aria-hidden
            />
            <span className="text-[13px] font-semibold text-foreground/90 truncate max-w-[200px]">{bizName}</span>
          </div>
          <span className="hidden text-[11px] text-muted-foreground/50 md:inline">
            {savePhase === "saving" && (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" /> Saving…
              </span>
            )}
            {savePhase === "saved" && savedAtHm && (
              <span>Saved {savedAtHm}</span>
            )}
            {savePhase === "idle" && savedAtHm && (
              <span>Last saved {savedAtHm} — autosave on pause</span>
            )}
            {savePhase === "error" && (
              <span className="text-amber-400">
                {saveErr || "Save failed — ⌘S to retry"}
              </span>
            )}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={cn(
              "hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition hover:bg-white/[0.06] md:inline-flex",
              rightMode === "versions"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-white/[0.1] text-muted-foreground",
            )}
            onClick={() => setRightMode((r) => (r === "versions" ? "refine" : "versions"))}
          >
            <History className="size-3.5" />
            History
          </button>
          <button
            type="button"
            className="hidden rounded-full bg-emerald-500 px-5 py-1.5 text-[12px] font-semibold text-black shadow-sm hover:bg-emerald-400 disabled:opacity-40 md:inline"
            disabled={doneDisabled || doneLoading}
            onClick={() => void onDone()}
          >
            {doneLoading ? "Saving…" : "Done →"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── Left sidebar ── */}
        <nav className="hidden w-[200px] shrink-0 flex-col border-r border-white/[0.06] bg-[#111] md:flex min-h-0">
          <div className="shrink-0 px-4 pt-5 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
              Sections
            </p>
          </div>
          <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
            {sections.length === 0 ? (
              <p className="px-2 text-[11px] text-muted-foreground/40">No sections parsed.</p>
            ) : (
              sections.map((sec) => {
                const active = activeSectionSlug === sec.slug;
                return (
                  <button
                    key={sec.slug}
                    type="button"
                    onClick={() => scrollToSoulSection(sec)}
                    className={cn(
                      "group w-full min-w-0 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                      active
                        ? "bg-white/[0.07] text-foreground"
                        : "text-muted-foreground/60 hover:bg-white/[0.04] hover:text-foreground/80",
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <span className={cn(
                        "shrink-0 text-[10px] font-mono font-bold tabular-nums transition-colors pt-0.5",
                        active ? "text-emerald-400" : "text-muted-foreground/30 group-hover:text-muted-foreground/50",
                      )}>
                        {String(sec.num).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 text-[12px] font-medium leading-snug text-left break-words">
                        {shortenNavTitle(decodeSoulNavTitle(sec.title), 22)}
                      </span>
                    </div>
                    <div className="mt-1.5 pl-[22px]">
                      <ConfidencePill c={sec.confidence} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </nav>

        {/* ── Main document area ── */}
        <main
          ref={editorScrollRef}
          className="relative min-w-0 flex-1 overflow-y-auto bg-[#0f0f0f] soul-doc-scroll-root"
        >
          {/* Document header */}
          <div className="sticky top-0 z-10 border-b border-white/[0.05] bg-[#0f0f0f]/90 backdrop-blur-sm px-8 py-4">
            <p className="text-[18px] font-semibold leading-snug text-foreground/95">{docTitle}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/40">{metaLine}</p>
          </div>

          <div className="px-8 py-6 pb-28">
            {sections.length === 0 ? (
              <p className="mb-4 text-[12px] text-muted-foreground/45">
                Brug <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px]">
                  ## 1. Section title
                </code>{" "}
                for numbered sections in the left nav.
              </p>
            ) : null}
            <SoulMarkdownDocumentEditor
              key={businessId}
              markdown={soulMarkdownForEditor}
              onChange={setSoulMarkdown}
              navSections={sections}
              placeholder="Click here to edit — tables, lists, and headings work like task descriptions. Changes save automatically."
            />
          </div>

          <div className="h-20" />
        </main>

        {/* ── Right panel ── */}
        <aside className="hidden shrink-0 flex-col border-l border-white/[0.06] bg-[#111] md:flex md:w-[400px] lg:w-[448px]">

          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRightMode("refine")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  rightMode === "refine"
                    ? "bg-white/[0.08] text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setRightMode("versions")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  rightMode === "versions"
                    ? "bg-white/[0.08] text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
              >
                History
              </button>
            </div>
          </div>

          {rightMode === "versions" ? (
            /* Version history */
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-1.5 overflow-y-auto p-4">
                {snapshots.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground/40">
                    Snapshots appear after the first autosave.
                  </p>
                ) : (
                  snapshots.map((sn, idx) => (
                    <button
                      key={sn.id}
                      type="button"
                      onClick={() =>
                        setVersionPeek({
                          markdown: sn.markdown,
                          label: idx === 0
                            ? `● Current (${relDa(sn.savedAt)})`
                            : `v${snapshots.length - idx} · ${relDa(sn.savedAt)}`,
                        })
                      }
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-white/[0.05]",
                        idx === 0
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                          : "border-white/[0.06] text-muted-foreground",
                      )}
                    >
                      <span className="font-medium">
                        {idx === 0 ? "● Current" : `v${snapshots.length - idx}`}
                      </span>
                      <span className="ml-2 text-[10px] opacity-60">
                        {hmDa(new Date(sn.savedAt))}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Refinement chat */
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-3">

                {/* Interview archive label */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <span className="shrink-0 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/30">
                    Interview archive
                  </span>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                {transcriptLoading ? (
                  <p className="text-[11px] text-muted-foreground/40">Loading transcript…</p>
                ) : interviewTurns && interviewTurns.length ? (
                  <div className="space-y-2">
                    {interviewTurns.map((t) =>
                      t.role === "assistant" ? (
                        <div
                          key={t.id}
                          className="rounded-xl bg-white/[0.04] px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground/70"
                        >
                          {clipAssistantTranscriptSnippet(t.content, 300)}
                        </div>
                      ) : (
                        <div
                          key={t.id}
                          className="ml-3 border-l-2 border-white/[0.1] py-1 pl-3 text-[11px] text-muted-foreground/50"
                        >
                          {t.content}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/40">No interview turns yet.</p>
                )}

                {/* Divider between interview and refinement */}
                <div className="flex items-center gap-2 py-1">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <span className="shrink-0 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/30">
                    Refinements
                  </span>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                {/* Refinement messages */}
                {openingGuidanceLoading && refinementMessages.length === 0 ? (
                  <div className="flex gap-2.5">
                    <div className="size-5 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mt-0.5">
                      <span className="font-mono text-[8px] text-emerald-400 font-bold">G</span>
                    </div>
                    <div className="rounded-xl rounded-tl-none bg-white/[0.05] px-3 py-2.5 text-[12px] text-muted-foreground/70 flex-1">
                      Henter finpudsnings-vejledning ud fra dit dokument…
                    </div>
                  </div>
                ) : null}

                {refinementMessages.length === 0 && !openingGuidanceLoading ? (
                  <p className="text-[11px] text-muted-foreground/30 italic">
                    Skriv til AI&apos;en for at opdatere dokumentet…
                  </p>
                ) : (
                  refinementMessages.map((m, i) =>
                    m.role === "ai" ? (
                      <div key={i} className="flex gap-2.5">
                        <div className="size-5 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mt-0.5">
                          <span className="font-mono text-[8px] text-emerald-400 font-bold">G</span>
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl rounded-tl-none bg-white/[0.05] px-3 py-2.5 text-[12px] leading-relaxed text-foreground/80">
                          <RefinementAssistantMarkdown
                            markdown={splitAssistantBodyAndQuickReplies(m.content, {
                              maxChipLabelLength: REFINE_QUICK_REPLY_LABEL_CAP,
                            }).body}
                          />
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="space-y-1.5">
                        {m.quote && (
                          <div className="ml-8 rounded-lg border-l-2 border-emerald-500/40 bg-emerald-500/8 px-3 py-2 text-[10px] italic text-foreground/50">
                            «{m.quote.length > 160 ? `${m.quote.slice(0, 160)}…` : m.quote}»
                          </div>
                        )}
                        <div className="flex justify-end">
                          <div className="max-w-[85%] rounded-xl rounded-tr-none bg-primary/15 px-3 py-2.5 text-[12px] text-foreground/80">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    ),
                  )
                )}

                {/* Thinking indicator */}
                {refinementBusy && (
                  <div className="flex gap-2.5">
                    <div className="size-5 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mt-0.5">
                      <span className="font-mono text-[8px] text-emerald-400 font-bold">G</span>
                    </div>
                    <div className="rounded-xl rounded-tl-none bg-white/[0.05] px-3 py-2.5 flex items-center gap-1">
                      {[0, 120, 240].map((delay) => (
                        <span
                          key={delay}
                          className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quoted snippets */}
              {quotedTexts.length > 0 && (
                <div className="shrink-0 border-t border-white/[0.06] px-4 pt-3 space-y-1.5">
                  <p className="text-[9px] text-muted-foreground/40 font-semibold uppercase tracking-wider">
                    Quoted context
                  </p>
                  {quotedTexts.map((q, qi) => (
                    <div
                      key={qi}
                      className="relative flex rounded-lg border border-emerald-800/30 bg-emerald-950/20 px-3 py-2"
                    >
                      <p className="text-[10px] leading-snug text-emerald-200/70 italic flex-1">
                        {q.slice(0, 120)}{q.length > 120 ? "…" : ""}
                      </p>
                      <button
                        type="button"
                        className="ml-2 shrink-0 text-muted-foreground/40 hover:text-foreground"
                        onClick={() => setQuotedTexts((qs) => qs.filter((_, j) => j !== qi))}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat input */}
              <div className="shrink-0 border-t border-white/[0.06] p-4">
                <RefinementQuickReplies
                  replies={refinementQuickReplies}
                  disabled={refinementBusy || openingGuidanceLoading}
                  onPick={(v) => sendRefinement(v)}
                  onFocusFreeform={() => chatTaRef.current?.focus()}
                />
                <div className={cn(
                  "mt-2 flex items-end gap-2 rounded-xl border bg-white/[0.03] px-3 py-2.5 transition-colors",
                  refinementBusy || openingGuidanceLoading
                    ? "border-white/[0.05] opacity-60"
                    : "border-white/[0.09] focus-within:border-primary/35",
                )}>
                  <textarea
                    ref={chatTaRef}
                    rows={1}
                    value={editorInput}
                    disabled={refinementBusy || openingGuidanceLoading}
                    placeholder={
                      openingGuidanceLoading
                        ? "Vent…"
                        : refinementBusy
                          ? "Waiting…"
                          : "Bed AI om at opdatere dokumentet…"
                    }
                    onChange={(e) => {
                      setEditorInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendRefinement();
                      }
                    }}
                    className="flex-1 resize-none bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/30 disabled:cursor-not-allowed min-h-[20px]"
                    style={{ height: "20px" }}
                  />
                  <button
                    type="button"
                    disabled={!editorInput.trim() || refinementBusy || openingGuidanceLoading}
                    onClick={() => sendRefinement()}
                    className="shrink-0 flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-30 cursor-pointer"
                    aria-label="Send"
                  >
                    {refinementBusy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ArrowUp className="size-3.5" strokeWidth={2.5} />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground/25 text-center">
                  AI kan læse og opdatere dokumentet på én gang. Brug <strong className="font-semibold text-muted-foreground/45">History</strong>{" "}
                  til at sammenligne eller gendanne, hvis en opdatering skal rulles tilbage — visuel grøn/rød diff kommer som næste skridt.
                </p>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ── Version peek overlay ── */}
      {versionPeek && (
        <div className="absolute inset-0 z-[200] flex flex-col bg-black/70 backdrop-blur-sm">
          <div className="m-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111] shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
              <span className="text-[13px] font-medium">{versionPeek.label}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-white/[0.06]"
                  onClick={() => setVersionPeek(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-500"
                  onClick={() => {
                    setSoulMarkdown(versionPeek.markdown);
                    setVersionPeek(null);
                  }}
                >
                  <RotateCcw className="size-3.5" />
                  Restore
                </button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
                {versionPeek.markdown}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile nav dropdown ── */}
      {mobileNavOpen && (
        <div className="absolute left-0 right-0 top-[calc(48px+44px)] z-[150] mx-3 max-h-56 overflow-y-auto rounded-xl border border-white/[0.1] bg-[#1a1a1a] p-2 shadow-2xl md:hidden">
          {sections.map((sec) => (
            <button
              key={sec.slug}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              onClick={() => {
                scrollToSoulSection(sec);
                setMobileNavOpen(false);
              }}
            >
              <span className="font-mono text-[10px] text-muted-foreground/40">{sec.num}.</span>
              {shortenNavTitle(decodeSoulNavTitle(sec.title), 32)}
              <ConfidencePill c={sec.confidence} />
            </button>
          ))}
        </div>
      )}

      {/* ── Mobile toolbar ── */}
      <div className="flex h-11 shrink-0 items-center justify-between border-t border-white/[0.07] px-3 md:hidden">
        <button
          type="button"
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          <ChevronDown className={cn("size-4 transition", mobileNavOpen && "rotate-180")} />
          Sections
        </button>
        <button
          type="button"
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-[12px] font-semibold text-white"
          disabled={doneDisabled || doneLoading}
          onClick={() => void onDone()}
        >
          {doneLoading ? "…" : "Done"}
        </button>
      </div>

      {/* ── Mobile chat FAB ── */}
      {!mobileChatOpen && (
        <button
          type="button"
          className="fixed bottom-16 right-4 z-[100] flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl md:hidden"
          onClick={() => setMobileChatOpen(true)}
        >
          <MessageSquare className="size-5" />
        </button>
      )}

      {mobileChatOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[150] max-h-[72vh] flex flex-col rounded-t-2xl border border-white/[0.1] bg-[#1a1a1a] shadow-2xl md:hidden">
          <header className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <span className="text-[13px] font-semibold">AI Chat</span>
            <button type="button" onClick={() => setMobileChatOpen(false)}>
              <X className="size-5 text-muted-foreground" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {openingGuidanceLoading && refinementMessages.length === 0 ? (
              <div className="rounded-xl bg-white/[0.05] px-3 py-2 text-[12px] text-muted-foreground">
                Henter finpudsnings-vejledning…
              </div>
            ) : null}
            {refinementMessages.map((m, i) => (
              <div key={i} className={cn("text-[12px]", m.role === "ai" ? "text-muted-foreground" : "text-foreground")}>
                {m.role === "ai" ? (
                  <div className="rounded-xl bg-white/[0.05] px-3 py-2">
                    <RefinementAssistantMarkdown
                      markdown={splitAssistantBodyAndQuickReplies(m.content, {
                        maxChipLabelLength: REFINE_QUICK_REPLY_LABEL_CAP,
                      }).body}
                    />
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-xl bg-primary/15 px-3 py-2">{m.content}</div>
                  </div>
                )}
              </div>
            ))}
            {refinementBusy && (
              <div className="rounded-xl bg-white/[0.05] px-3 py-2 flex gap-1">
                {[0, 120, 240].map((d) => (
                  <span key={d} className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-white/[0.07] p-3 space-y-2">
            <RefinementQuickReplies
              replies={refinementQuickReplies}
              disabled={refinementBusy || openingGuidanceLoading}
              onPick={(v) => {
                sendRefinement(v);
                setMobileChatOpen(false);
              }}
              onFocusFreeform={() => mobileChatTaRef.current?.focus()}
            />
            <div className="flex gap-2">
              <textarea
                ref={mobileChatTaRef}
                rows={2}
                value={editorInput}
                disabled={refinementBusy || openingGuidanceLoading}
                onChange={(e) => setEditorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendRefinement();
                    setMobileChatOpen(false);
                  }
                }}
                placeholder={
                  openingGuidanceLoading ? "Vent…" : refinementBusy ? "…" : "Skriv til AI…"
                }
                className="flex-1 resize-none rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground/30"
              />
              <button
                type="button"
                disabled={!editorInput.trim() || refinementBusy || openingGuidanceLoading}
                onClick={() => {
                  sendRefinement();
                  setMobileChatOpen(false);
                }}
                className="self-end flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
