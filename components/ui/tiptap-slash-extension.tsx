"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
  Terminal,
  Type,
} from "lucide-react";

import { cn } from "@/lib/utils";

// ── Slash command definitions ──────────────────────────────────────────────
export type SlashCommand = {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
};

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    title: "Text",
    description: "Plain paragraph",
    icon: <Type className="size-3.5" />,
    command: (editor) => editor.chain().focus().clearNodes().setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Large heading",
    icon: <Heading1 className="size-3.5" />,
    command: (editor) => editor.chain().focus().clearNodes().setHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium heading",
    icon: <Heading2 className="size-3.5" />,
    command: (editor) => editor.chain().focus().clearNodes().setHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small heading",
    icon: <Heading3 className="size-3.5" />,
    command: (editor) => editor.chain().focus().clearNodes().setHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: <List className="size-3.5" />,
    command: (editor) => editor.chain().focus().clearNodes().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    icon: <ListOrdered className="size-3.5" />,
    command: (editor) => editor.chain().focus().clearNodes().toggleOrderedList().run(),
  },
  {
    title: "Code Block",
    description: "Code snippet",
    icon: <Terminal className="size-3.5" />,
    command: (editor) => editor.chain().focus().clearNodes().toggleCodeBlock().run(),
  },
  {
    title: "Quote",
    description: "Blockquote",
    icon: <Quote className="size-3.5" />,
    command: (editor) => editor.chain().focus().clearNodes().setBlockquote().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: <Minus className="size-3.5" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Inline Code",
    description: "Inline code",
    icon: <Code className="size-3.5" />,
    command: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    title: "Table",
    description: "Insert table",
    icon: <TableIcon className="size-3.5" />,
    command: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

// ── SlashCommandList component ─────────────────────────────────────────────
type SlashCommandListProps = {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
};

export type SlashCommandListHandle = {
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
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center",
                    i === selected ? "text-foreground/70" : "text-muted-foreground/40",
                  )}
                >
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

/**
 * Slash menu (`/`): same behavior as task / comment TipTap editors.
 */
export function createSlashExtension() {
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
