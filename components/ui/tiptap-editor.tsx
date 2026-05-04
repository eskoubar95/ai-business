"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { cn } from "@/lib/utils";
import { lowlight } from "@/lib/ui/tiptap-lowlight";
import { TiptapCodeBlockView } from "@/components/ui/tiptap-code-block-view";
import { createSlashExtension } from "@/components/ui/tiptap-slash-extension";

// ── TiptapEditor ───────────────────────────────────────────────────────────
type TiptapEditorProps = {
  initialContent?: string;
  placeholder?: string;
  onUpdate?: (html: string) => void;
  className?: string;
  autofocus?: boolean;
};

export function TiptapEditor({
  initialContent = "",
  placeholder = "Write something… or type / for commands",
  onUpdate,
  className,
  autofocus = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockLowlight
        .extend({
          addNodeView() {
            return ReactNodeViewRenderer(TiptapCodeBlockView);
          },
        })
        .configure({ lowlight, defaultLanguage: "plaintext" }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      createSlashExtension(),
    ],
    content: initialContent || "",
    autofocus,
    editorProps: {
      attributes: { class: "outline-none" },
      handleKeyDown(view, event) {
        const { $anchor } = view.state.selection;

        // Traverse up to find if inside a code block
        let codeBlockDepth = -1;
        for (let d = $anchor.depth; d >= 0; d--) {
          if ($anchor.node(d).type.name === "codeBlock") {
            codeBlockDepth = d;
            break;
          }
        }
        const inCodeBlock = codeBlockDepth >= 0;

        // Tab → 2-space indent inside code block
        if (event.key === "Tab" && inCodeBlock) {
          event.preventDefault();
          if (event.shiftKey) {
            const pos = $anchor.pos;
            const lineStart = $anchor.start();
            const textBefore = view.state.doc.textBetween(lineStart, pos);
            const spaces = textBefore.match(/^ {1,2}/)?.[0] ?? "";
            if (spaces) view.dispatch(view.state.tr.delete(lineStart, lineStart + spaces.length));
          } else {
            view.dispatch(view.state.tr.insertText("  "));
          }
          return true;
        }

        // Cmd/Ctrl+A → scope selection to code block or just the editor
        if ((event.metaKey || event.ctrlKey) && event.key === "a") {
          event.preventDefault();
          if (inCodeBlock) {
            const start = $anchor.start(codeBlockDepth);
            const end = $anchor.end(codeBlockDepth);
            view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start, end)));
          } else {
            // Select all within editor only
            const start = 1;
            const end = view.state.doc.content.size - 1;
            view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start, end)));
          }
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
  });

  return (
    <div className={cn("tiptap-editor relative", className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
