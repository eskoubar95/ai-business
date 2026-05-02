"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NovelEditorClient({
  initialContent,
  className,
}: {
  initialContent?: string;
  className?: string;
}) {
  const [codeView, setCodeView] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write something…" }),
    ],
    content: initialContent ?? "<p></p>",
    editorProps: {
      attributes: {
        class: "outline-none min-h-[200px] text-[13.5px] leading-relaxed text-foreground/80",
      },
    },
  });

  const getHtml = useCallback(() => editor?.getHTML() ?? "", [editor]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => setCodeView((v) => !v)}
        >
          {codeView ? "Visual" : "HTML"} view
        </Button>
      </div>
      {codeView ? (
        <pre className="border-border bg-muted text-foreground max-h-[480px] overflow-auto rounded-md border p-3 font-mono text-xs leading-relaxed">
          {getHtml()}
        </pre>
      ) : (
        <div className="tiptap-task-editor rounded-md border border-border bg-white/[0.02] px-4 py-3 prose prose-invert prose-sm max-w-none">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}
