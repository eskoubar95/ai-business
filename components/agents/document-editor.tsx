"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, FileText, Plus, Trash2, X } from "lucide-react";

import {
  createAgentDocument,
  deleteAgentDocument,
  updateAgentDocument,
} from "@/lib/agents/document-actions";
import {
  DEFAULT_DOC_SLUG,
  slugify,
  toFilename,
  type AgentDocumentRow,
} from "@/lib/agents/document-model";
import { cn } from "@/lib/utils";

type DocEntry = { slug: string; filename: string; content: string };

type Props = {
  agentId: string;
  initialDocs: AgentDocumentRow[];
};

export function DocumentEditor({ agentId, initialDocs }: Props) {
  const [docs, setDocs] = useState<DocEntry[]>(
    initialDocs.map((d) => ({ slug: d.slug, filename: d.filename, content: d.content })),
  );
  const [selected, setSelected] = useState<string>(DEFAULT_DOC_SLUG);

  // New file input state
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);

  // Save state per slug
  const [savedAt, setSavedAt] = useState<Record<string, Date>>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (adding) newInputRef.current?.focus();
  }, [adding]);

  function updateContent(slug: string, value: string) {
    setDocs((prev) => prev.map((d) => (d.slug === slug ? { ...d, content: value } : d)));
  }

  function save(slug: string) {
    const doc = docs.find((d) => d.slug === slug);
    if (!doc) return;
    setError(null);
    setPendingSlug(slug);
    startTransition(async () => {
      try {
        await updateAgentDocument(agentId, slug, doc.content);
        setSavedAt((prev) => ({ ...prev, [slug]: new Date() }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setPendingSlug(null);
      }
    });
  }

  function confirmAdd() {
    const raw = newName.trim();
    if (!raw) { setAdding(false); setNewName(""); return; }

    const slug = slugify(raw);
    const filename = toFilename(raw);

    // Don't duplicate
    if (docs.some((d) => d.slug === slug)) {
      setSelected(slug);
      setAdding(false);
      setNewName("");
      return;
    }

    const newDoc: DocEntry = { slug, filename, content: "" };
    setDocs((prev) => [...prev, newDoc]);
    setSelected(slug);
    setAdding(false);
    setNewName("");

    // Persist the new file in the background
    startTransition(async () => {
      try {
        await createAgentDocument(agentId, raw);
      } catch {
        // Non-critical: file exists in UI already
      }
    });
  }

  function handleDeleteDoc(slug: string) {
    if (slug === DEFAULT_DOC_SLUG) return;
    startTransition(async () => {
      try {
        await deleteAgentDocument(agentId, slug);
        setDocs((prev) => prev.filter((d) => d.slug !== slug));
        if (selected === slug) setSelected(DEFAULT_DOC_SLUG);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  const currentDoc = docs.find((d) => d.slug === selected) ?? docs[0];
  const isSaving = pendingSlug === currentDoc?.slug;

  return (
    <div
      className="flex overflow-hidden rounded-md border border-border"
      style={{ minHeight: 440 }}
      data-testid="agent-doc-editor"
    >
      {/* ─── Left panel: file list ─── */}
      <div className="flex w-48 shrink-0 flex-col border-r border-border bg-white/[0.015]">
        {/* Header */}
        <div className="flex h-10 items-center justify-between border-b border-white/[0.07] px-3">
          <span className="section-label">Files</span>
          <button
            type="button"
            onClick={() => { setAdding(true); setNewName(""); }}
            className="flex size-5 cursor-pointer items-center justify-center rounded text-muted-foreground/50 hover:bg-white/[0.06] hover:text-foreground transition-colors"
            aria-label="New file"
          >
            <Plus className="size-3" />
          </button>
        </div>

        {/* File list */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-1.5" aria-label="Documents">
          {docs.map((doc) => {
            const isActive = selected === doc.slug;
            const isDefault = doc.slug === DEFAULT_DOC_SLUG;
            return (
              <div
                key={doc.slug}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(doc.slug)}
                onKeyDown={(e) => e.key === "Enter" && setSelected(doc.slug)}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 transition-colors duration-100",
                  isActive
                    ? "bg-white/[0.07] text-foreground"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                <FileText
                  className={cn(
                    "size-3 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground/30",
                  )}
                />
                <span className="flex-1 truncate font-mono text-[11px]">{doc.filename}</span>
                {isDefault ? (
                  <span className="shrink-0 rounded-sm bg-white/[0.07] px-1 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    DEF
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.slug); }}
                    className="hidden shrink-0 cursor-pointer rounded p-0.5 text-muted-foreground/30 hover:text-destructive group-hover:flex"
                    aria-label={`Delete ${doc.filename}`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Inline new-file input */}
          {adding && (
            <div className="flex items-center gap-1 rounded border border-white/[0.10] bg-white/[0.04] px-2 py-1">
              <FileText className="size-3 shrink-0 text-muted-foreground/30" />
              <input
                ref={newInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAdd();
                  if (e.key === "Escape") { setAdding(false); setNewName(""); }
                }}
                onBlur={confirmAdd}
                placeholder="filename.md"
                className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/30"
              />
              <button
                type="button"
                onClick={() => { setAdding(false); setNewName(""); }}
                className="shrink-0 cursor-pointer text-muted-foreground/30 hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* ─── Right panel: editor ─── */}
      {currentDoc ? (
        <div className="flex min-w-0 flex-1 flex-col">
          {/* File header */}
          <div className="flex h-10 items-center justify-between border-b border-white/[0.07] px-4">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[12px] font-medium text-foreground">
                {currentDoc.filename}
              </span>
              <span className="text-[10px] text-muted-foreground/40">markdown</span>
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <span className="text-[11px] text-destructive">{error}</span>
              )}
              {savedAt[currentDoc.slug] && !isSaving && (
                <span className="flex items-center gap-1 text-[11px] text-success/70">
                  <Check className="size-3" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            data-testid={`agent-doc-editor-${currentDoc.slug}`}
            className={cn(
              "flex-1 resize-none bg-transparent px-4 py-3",
              "font-mono text-[12px] leading-relaxed text-foreground/90",
              "placeholder:text-muted-foreground/25 outline-none",
            )}
            placeholder={`# ${currentDoc.filename}\n\nWrite markdown here…`}
            value={currentDoc.content}
            onChange={(e) => updateContent(currentDoc.slug, e.target.value)}
            disabled={isSaving}
          />

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2.5">
            <span className="font-mono text-[10px] text-muted-foreground/30">
              {currentDoc.content.length} chars
            </span>
            <button
              type="button"
              data-testid={`agent-doc-save-${currentDoc.slug}`}
              disabled={isSaving}
              onClick={() => save(currentDoc.slug)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5",
                "text-[12px] font-medium text-foreground/80 transition-colors duration-150",
                "hover:border-white/[0.14] hover:bg-white/[0.04]",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              {isSaving ? "Saving…" : `Save ${currentDoc.filename}`}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
