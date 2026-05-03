"use client";

import { useState, useEffect, useRef } from "react";
import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import { cn } from "@/lib/utils";

const CODE_LANGUAGES = [
  { value: "plaintext", label: "Plain" },
  { value: "javascript", label: "JS" },
  { value: "typescript", label: "TS" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
];

/** React node view for TipTap code blocks with language picker (shared by rich text editors). */
export function TiptapCodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const language = node.attrs.language ?? "plaintext";
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const currentLabel = CODE_LANGUAGES.find((l) => l.value === language)?.label ?? language;

  return (
    <NodeViewWrapper className="code-block-wrapper relative my-3 rounded-lg border border-white/[0.07] bg-[#141414]">
      <div className="flex items-center justify-end px-3 py-1.5 border-b border-white/[0.06] rounded-t-lg bg-[#141414]">
        <div className="relative" ref={dropdownRef}>
          <button
            ref={btnRef}
            type="button"
            contentEditable={false}
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen((v) => !v);
            }}
            className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-mono text-white/35 hover:text-white/60 hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] transition-all select-none"
          >
            {currentLabel}
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              className={cn("opacity-50 transition-transform", open && "rotate-180")}
            >
              <path
                d="M1.5 3L4 5.5L6.5 3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {open && (
            <div
              contentEditable={false}
              className="absolute right-0 top-full mt-1 z-[200] min-w-[100px] rounded-md border border-white/[0.10] bg-[#1c1c1c] shadow-2xl shadow-black/70 py-1 overflow-y-auto max-h-[220px]"
            >
              {CODE_LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    updateAttributes({ language: lang.value });
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-mono transition-colors",
                    lang.value === language
                      ? "text-white/85 bg-white/[0.08]"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]",
                  )}
                >
                  {lang.value === language && (
                    <span className="size-1 rounded-full bg-primary shrink-0" />
                  )}
                  {lang.value !== language && <span className="size-1 shrink-0" />}
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "1rem 1.25rem",
          minHeight: "72px",
          background: "transparent",
          border: "none",
          overflow: "auto",
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          fontSize: "12.5px",
          lineHeight: "1.65",
        }}
      >
        {/* TipTap types only allow `as="div"`; runtime accepts `code` inside <pre> for semantics/highlight.js. */}
        <NodeViewContent as={"code" as never} className="hljs-code-content" />
      </pre>
    </NodeViewWrapper>
  );
}
