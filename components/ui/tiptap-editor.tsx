"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useEditor, EditorContent, ReactRenderer, ReactNodeViewRenderer } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Terminal,
  Type,
  Table as TableIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { lowlight } from "@/lib/ui/tiptap-lowlight";
import { TiptapCodeBlockView } from "@/components/ui/tiptap-code-block-view";

// ── Slash command definitions ──────────────────────────────────────────────
type SlashCommand = {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: ReturnType<typeof useEditor>) => void;
};

const SLASH_COMMANDS: SlashCommand[] = [
  {
    title: "Text",
    description: "Plain paragraph",
    icon: <Type className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().clearNodes().setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Large heading",
    icon: <Heading1 className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().clearNodes().setHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium heading",
    icon: <Heading2 className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().clearNodes().setHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small heading",
    icon: <Heading3 className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().clearNodes().setHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: <List className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().clearNodes().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    icon: <ListOrdered className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().clearNodes().toggleOrderedList().run(),
  },
  {
    title: "Code Block",
    description: "Code snippet",
    icon: <Terminal className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().clearNodes().toggleCodeBlock().run(),
  },
  {
    title: "Quote",
    description: "Blockquote",
    icon: <Quote className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().clearNodes().setBlockquote().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: <Minus className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Inline Code",
    description: "Inline code",
    icon: <Code className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().toggleCode().run(),
  },
  {
    title: "Table",
    description: "Insert table",
    icon: <TableIcon className="size-3.5" />,
    command: (editor) =>
      editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

// ── SlashCommandList component ─────────────────────────────────────────────
type SlashCommandListProps = {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
};

type SlashCommandListHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

const SlashCommandList = forwardRef<SlashCommandListHandle, SlashCommandListProps>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }) {
        if (event.key === "ArrowUp") {
          setSelected((s) => (s + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelected((s) => (s + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          command(items[selected]!);
          return true;
        }
        return false;
      },
    }));

    return (
      <div className="slash-menu z-50 w-[220px] overflow-hidden rounded-lg border border-white/[0.10] bg-[#181818] shadow-2xl shadow-black/60">
        {items.length === 0 ? (
          <p className="px-3 py-2.5 text-[11px] text-muted-foreground/40 italic">No match</p>
        ) : (
          <div className="flex flex-col gap-px p-1">
            {items.map((item, i) => (
              <button
                key={item.title}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  command(item);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  i === selected
                    ? "bg-white/[0.09] text-foreground"
                    : "text-foreground/50 hover:bg-white/[0.05] hover:text-foreground/75",
                )}
              >
                <span className={cn(
                  "flex size-5 shrink-0 items-center justify-center",
                  i === selected ? "text-foreground/70" : "text-muted-foreground/40",
                )}>
                  {item.icon}
                </span>
                <span className="text-[11.5px] font-medium truncate leading-none">{item.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);
SlashCommandList.displayName = "SlashCommandList";

// ── Slash command Tiptap extension ─────────────────────────────────────────
function createSlashExtension(editorRef: React.MutableRefObject<ReturnType<typeof useEditor>>) {
  return Extension.create({
    name: "slashCommand",
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          allowSpaces: false,
          startOfLine: false,
          command: ({ editor, range, props }) => {
            const item = props as SlashCommand;
            editor.chain().focus().deleteRange(range).run();
            item.command(editor);
          },
          items: ({ query }: { query: string }) => {
            return SLASH_COMMANDS.filter((c) =>
              c.title.toLowerCase().startsWith(query.toLowerCase()),
            );
          },
          render: () => {
            let component: ReactRenderer<SlashCommandListHandle>;
            let popup: TippyInstance[];

            return {
              onStart(props) {
                component = new ReactRenderer(SlashCommandList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                  theme: "none",
                  animation: "shift-away",
                  duration: [120, 80],
                });
              },
              onUpdate(props) {
                component.updateProps(props);
                if (!props.clientRect) return;
                popup[0]?.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },
              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0]?.hide();
                  return true;
                }
                return component.ref?.onKeyDown(props) ?? false;
              },
              onExit() {
                popup[0]?.destroy();
                component.destroy();
              },
            };
          },
        }),
      ];
    },
  });
}

// ── BubbleToolbarBtn ───────────────────────────────────────────────────────
function BubbleBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
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
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

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
      createSlashExtension(editorRef as React.MutableRefObject<ReturnType<typeof useEditor>>),
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

  // Keep editorRef in sync
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editorRef as any).current = editor;
  }, [editor]);

  return (
    <div className={cn("tiptap-editor relative", className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
