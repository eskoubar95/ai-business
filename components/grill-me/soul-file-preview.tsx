"use client";

import ReactMarkdown from "react-markdown";

export function SoulFilePreview({ markdown }: { markdown: string }) {
  return (
    <div
      data-testid="grill-me-soul-preview"
      className="border-border bg-card text-card-foreground [&_h1]:text-foreground [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_li]:my-0.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 rounded-lg border p-4 text-sm"
    >
      <h3 className="text-foreground mb-3 text-sm font-semibold">Soul file</h3>
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
