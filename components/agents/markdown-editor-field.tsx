"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

type Props = {
  value: string;
  onChange: (next: string) => void;
  "data-testid"?: string;
};

export function MarkdownEditorField({ value, onChange, "data-testid": testId }: Props) {
  return (
    <div className="markdown-editor-field w-full" data-color-mode="light" data-testid={testId}>
      <MDEditor value={value} onChange={(v) => onChange(typeof v === "string" ? v : "")} height={280} />
    </div>
  );
}
