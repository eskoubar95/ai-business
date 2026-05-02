"use client";

import { ChevronRight, FileCode, FileJson, FileText, Folder } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type FileTreeNode = {
  id: string;
  name: string;
  /** When set, this node is a folder that may contain children */
  children?: FileTreeNode[];
};

function iconForName(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".json")) {
    return FileJson;
  }
  if (lower.endsWith(".js") || lower.endsWith(".mjs")) {
    return FileCode;
  }
  return FileText;
}

function FileTreeRow({
  node,
  depth,
  selectedId,
  onSelect,
  expanded,
  onToggle,
}: {
  node: FileTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isFolder = node.children !== undefined;
  const isOpen = isFolder && expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const paddingLeft = 8 + depth * 14;

  const Icon = isFolder ? Folder : iconForName(node.name);

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "hover:bg-accent h-auto w-full cursor-pointer justify-start rounded-md px-2 py-1.5 text-sm font-normal transition-colors duration-150",
          isSelected && "bg-accent text-primary",
        )}
        style={{ paddingLeft }}
        onClick={() => {
          if (isFolder) {
            onToggle(node.id);
          }
          onSelect(node.id);
        }}
      >
        {isFolder ? (
          <ChevronRight
            className={cn(
              "text-muted-foreground mr-1 size-4 shrink-0 transition-transform duration-150",
              isOpen && "rotate-90",
            )}
            aria-hidden
          />
        ) : (
          <span className="mr-1 w-4 shrink-0" aria-hidden />
        )}
        <Icon className="text-muted-foreground mr-2 size-4 shrink-0" aria-hidden />
        <span className="truncate">{node.name}</span>
      </Button>
      {isFolder && isOpen && node.children
        ? node.children.map((child) => (
            <FileTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))
        : null}
    </div>
  );
}

export function FileTree({
  nodes,
  selectedId,
  onSelect,
  className,
}: {
  nodes: FileTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const onToggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className={cn("flex flex-col gap-0.5 overflow-y-auto", className)}>
      {nodes.map((node) => (
        <FileTreeRow
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          expanded={expanded}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
