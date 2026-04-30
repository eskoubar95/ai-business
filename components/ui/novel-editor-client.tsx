"use client";

import { useCallback, useState } from "react";
import type { Editor, JSONContent } from "@tiptap/react";
import { EditorContent, EditorRoot } from "novel";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const defaultDoc: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};

export function NovelEditorClient({
  initialContent,
  className,
}: {
  initialContent?: JSONContent;
  className?: string;
}) {
  const [codeView, setCodeView] = useState(false);
  const [jsonSnapshot, setJsonSnapshot] = useState(() =>
    JSON.stringify(initialContent ?? defaultDoc, null, 2),
  );

  const handleUpdate = useCallback(({ editor }: { editor: Editor }) => {
    setJsonSnapshot(JSON.stringify(editor.getJSON(), null, 2));
  }, []);

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
          {codeView ? "Visual" : "Code"} view
        </Button>
      </div>
      {codeView ? (
        <pre className="border-border bg-muted text-foreground max-h-[480px] overflow-auto rounded-md border p-3 font-mono text-xs leading-relaxed">
          {jsonSnapshot}
        </pre>
      ) : (
        <div className="border-border bg-card rounded-md border">
          <EditorRoot>
            <EditorContent
              className="prose prose-sm dark:prose-invert max-h-[480px] min-h-[200px] max-w-none overflow-auto p-4"
              initialContent={initialContent ?? defaultDoc}
              {...({
                onUpdate: handleUpdate,
              } as Record<string, unknown>)}
            />
          </EditorRoot>
        </div>
      )}
    </div>
  );
}
