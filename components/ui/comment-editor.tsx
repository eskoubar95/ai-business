"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { cn } from "@/lib/utils";
import { lowlight } from "@/lib/ui/tiptap-lowlight";
import { TiptapCodeBlockView } from "@/components/ui/tiptap-code-block-view";
import {
  createMentionExtension,
  createSlashExtension,
  type MentionItem,
} from "@/components/ui/comment-editor-parts";

export type { MentionItem } from "@/components/ui/comment-editor-parts";

function BubbleBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "flex size-[26px] items-center justify-center rounded transition-colors",
        active
          ? "bg-white/[0.18] text-foreground"
          : "text-muted-foreground/55 hover:bg-white/[0.08] hover:text-foreground/80",
      )}
    >
      {children}
    </button>
  );
}

export type CommentEditorHandle = {
  clear: () => void;
  submit: () => void;
};

type CommentEditorProps = {
  mentionItems?: MentionItem[];
  onSubmit: (html: string) => void;
  onEmpty?: () => void;
  onIsEmpty?: (isEmpty: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const CommentEditor = forwardRef<CommentEditorHandle, CommentEditorProps>(
  (
    {
      mentionItems = [],
      onSubmit,
      onEmpty,
      onIsEmpty,
      placeholder = "Leave a comment…",
      disabled = false,
    },
    ref,
  ) => {
    const editorRef = useRef<ReturnType<typeof useEditor>>(null);

    const mentionItemsRef = useRef<MentionItem[]>(mentionItems);
    useEffect(() => {
      mentionItemsRef.current = mentionItems;
    }, [mentionItems]);

    const handleSubmit = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const html = editor.getHTML();
      const isEmpty = editor.isEmpty;
      if (isEmpty) {
        onEmpty?.();
        return;
      }
      onSubmit(html);
    }, [onSubmit, onEmpty]);

    const editor = useEditor({
      immediatelyRender: false,
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
        createSlashExtension(editorRef as MutableRefObject<ReturnType<typeof useEditor>>),
        createMentionExtension(mentionItemsRef.current),
      ],
      editorProps: {
        attributes: { class: "outline-none" },
        handleKeyDown(view, event) {
          const { $anchor } = view.state.selection;

          let codeBlockDepth = -1;
          for (let d = $anchor.depth; d >= 0; d--) {
            if ($anchor.node(d).type.name === "codeBlock") {
              codeBlockDepth = d;
              break;
            }
          }
          const inCodeBlock = codeBlockDepth >= 0;

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

          if ((event.metaKey || event.ctrlKey) && event.key === "a") {
            event.preventDefault();
            if (inCodeBlock) {
              const start = $anchor.start(codeBlockDepth);
              const end = $anchor.end(codeBlockDepth);
              view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start, end)));
            } else {
              const start = 1;
              const end = view.state.doc.content.size - 1;
              view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start, end)));
            }
            return true;
          }

          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            handleSubmit();
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        onIsEmpty?.(editor.isEmpty);
      },
    });

    useEffect(() => {
      editorRef.current = editor;
    }, [editor]);

    useImperativeHandle(ref, () => ({
      clear() {
        editorRef.current?.commands.clearContent(true);
      },
      submit() {
        handleSubmit();
      },
    }));



    return (
      <div
        className={cn(
          "comment-editor",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        <EditorContent editor={editor} />
      </div>
    );
  },
);
CommentEditor.displayName = "CommentEditor";
