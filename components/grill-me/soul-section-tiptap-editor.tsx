"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

import { lowlight } from "@/lib/ui/tiptap-lowlight";
import { TiptapCodeBlockView } from "@/components/ui/tiptap-code-block-view";
import { createSlashExtension } from "@/components/ui/tiptap-slash-extension";
import { cn } from "@/lib/utils";
import type { ParsedSoulSection } from "@/lib/grill-me/soul-section-parser";

function markdownFromEditor(editor: NonNullable<ReturnType<typeof useEditor>>): string {
  const ext = editor as { getMarkdown?: () => string };
  return ext.getMarkdown?.() ?? "";
}

/** Set `id="soul-section-…"` on heading DOM from parser slugs (handles h1–h3, leading zeros). */
export function syncSoulSectionHeadingDomIds(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  navSections: ParsedSoulSection[],
): void {
  if (!navSections.length) return;
  const h2Positions: number[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== "heading") return;
    const level = node.attrs.level as number;
    if (level !== 2 && level !== 3) return;
    const text = node.textContent.replace(/\u00a0/g, " ").trim();
    if (!/^\d+\.\s+/.test(text)) return;
    h2Positions.push(pos);
  });
  const n = Math.min(h2Positions.length, navSections.length);
  for (let i = 0; i < n; i++) {
    const dom = editor.view.nodeDOM(h2Positions[i]);
    if (dom instanceof HTMLElement) dom.id = navSections[i].slug;
  }
}

export type SoulSectionTiptapEditorProps = {
  /** Initial section body (markdown only — no ## heading line). */
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * TipTap + `@tiptap/markdown`: same stack as `TiptapEditor` (tasks, comments), with
 * bidirectional markdown so the soul file stays plain `.md` on disk.
 */
export function SoulSectionTiptapEditor({
  markdown,
  onChange,
  placeholder = "Edit this section… Tables, headings, lists work like the rest of the app. Type / for blocks.",
  className,
}: SoulSectionTiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(TiptapCodeBlockView);
        },
      }).configure({ lowlight, defaultLanguage: "plaintext" }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({
        markedOptions: { gfm: true },
      }),
      createSlashExtension(),
    ],
    content: markdown,
    contentType: "markdown",
    autofocus: "end",
    editorProps: {
      attributes: {
        class: cn("outline-none min-h-[280px] max-w-none"),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(markdownFromEditor(ed));
    },
  });

  return (
    <div
      className={cn(
        "tiptap-editor soul-section-tiptap rounded-xl border border-primary/25 bg-[#0c0c0c] ring-1 ring-primary/15",
        className,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
}

export type SoulMarkdownDocumentEditorProps = {
  /** Full soul markdown (incl. `#` title and `## N.` sections). */
  markdown: string;
  onChange: (markdown: string) => void;
  /** When set, heading `id`s match left-nav slugs (ProseMirror-accurate). */
  navSections?: ParsedSoulSection[];
  placeholder?: string;
  className?: string;
};

function assignSoulSectionHeadingIdsFromDom(root: HTMLElement): void {
  const headings = root.querySelectorAll("h2, h3");
  let occ = 0;
  headings.forEach((h) => {
    const t = h.textContent?.replace(/\u00a0/g, " ").trim() ?? "";
    const m = /^(\d+)\.\s*/.exec(t);
    if (m) {
      h.id = `soul-section-${m[1]}-${occ}`;
      occ += 1;
    }
  });
}

/**
 * Single surface TipTap + markdown (same stack as tasks): click anywhere to edit,
 * no separate save/cancel — parent handles debounced persistence.
 */
export function SoulMarkdownDocumentEditor({
  markdown,
  onChange,
  navSections,
  placeholder = "Click to edit — type / for headings, lists, tables, and more.",
  className,
}: SoulMarkdownDocumentEditorProps) {
  const lastEmittedRef = useRef(markdown);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(TiptapCodeBlockView);
        },
      }).configure({ lowlight, defaultLanguage: "plaintext" }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({
        markedOptions: { gfm: true },
      }),
      createSlashExtension(),
    ],
    content: markdown,
    contentType: "markdown",
    autofocus: false,
    editorProps: {
      attributes: {
        class: cn(
          "outline-none min-h-[min(60vh,520px)] max-w-none text-[13px] leading-relaxed text-foreground/70",
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = markdownFromEditor(ed);
      lastEmittedRef.current = md;
      onChange(md);
    },
    onCreate: ({ editor: ed }) => {
      if (navSections?.length) syncSoulSectionHeadingDomIds(ed, navSections);
      else assignSoulSectionHeadingIdsFromDom(ed.view.dom as HTMLElement);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      if (navSections?.length) syncSoulSectionHeadingDomIds(editor, navSections);
      else assignSoulSectionHeadingIdsFromDom(editor.view.dom as HTMLElement);
    };
    sync();
    editor.on("update", sync);
    return () => {
      editor.off("update", sync);
    };
  }, [editor, navSections]);

  useEffect(() => {
    if (!editor) return;
    if (markdown === lastEmittedRef.current) return;
    const nextMarkdown = markdown;
    // TipTap `setContent` can trigger React `flushSync` via node views; defer past the commit phase.
    const t = window.setTimeout(() => {
      if (!editor || editor.isDestroyed) return;
      if (nextMarkdown === lastEmittedRef.current) return;
      editor.commands.setContent(nextMarkdown, { contentType: "markdown" });
      lastEmittedRef.current = nextMarkdown;
      if (navSections?.length) syncSoulSectionHeadingDomIds(editor, navSections);
      else assignSoulSectionHeadingIdsFromDom(editor.view.dom as HTMLElement);
    }, 0);
    return () => window.clearTimeout(t);
  }, [markdown, editor, navSections]);

  return (
    <div className={cn("tiptap-editor soul-prose soul-doc-tiptap relative", className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
