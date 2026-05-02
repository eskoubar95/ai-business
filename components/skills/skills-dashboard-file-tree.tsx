"use client";

import { Braces, ChevronRight, File, FileText, Folder } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FileTreeNode } from "@/components/ui/file-tree";

export function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/35">
        {label}
      </span>
      <span className="text-[12px] text-foreground/70 truncate" title={value}>
        {value}
      </span>
    </div>
  );
}

export function getSkillFileIcon(name: string) {
  if (name.endsWith(".json")) return <Braces className="size-3 text-muted-foreground/40 shrink-0" />;
  if (name.endsWith(".md")) return <FileText className="size-3 text-muted-foreground/40 shrink-0" />;
  return <File className="size-3 text-muted-foreground/40 shrink-0" />;
}

type TreeRowProps = {
  node: FileTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
};

export function SkillFileTreeRow({
  node,
  depth,
  expanded,
  onToggle,
  selectedPath,
  onSelectFile,
}: TreeRowProps) {
  const isFolder = Boolean(node.children);
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedPath === node.id;

  if (isFolder) {
    return (
      <>
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-left text-[11.5px] text-muted-foreground/60 hover:bg-white/[0.04] hover:text-foreground/80 transition-colors"
        >
          <Folder className="size-3 text-muted-foreground/30 shrink-0" />
          <span className="flex-1 truncate">{node.name}</span>
          <ChevronRight
            className={cn(
              "size-3 text-muted-foreground/30 transition-transform shrink-0",
              isExpanded && "rotate-90",
            )}
          />
        </button>
        {isExpanded &&
          node.children?.map((child) => (
            <SkillFileTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelectFile(node.id)}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-1 py-1 text-left text-[11.5px] transition-colors",
        isSelected
          ? "bg-white/[0.06] text-primary"
          : "text-muted-foreground/60 hover:bg-white/[0.04] hover:text-foreground/80",
      )}
    >
      {getSkillFileIcon(node.name)}
      <span className="flex-1 truncate">{node.name}</span>
    </button>
  );
}
