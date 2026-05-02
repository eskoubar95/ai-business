import type { LogEntry } from "./task-detail-types";

/** Used for Git branch name preview in task detail sidebar. */
export function slugifyTaskTitleSegment(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function getAuthorLabel(
  log: LogEntry,
  currentUserId: string,
  agentNames: Record<string, string>,
): string {
  if (log.authorType === "human" && log.authorId === currentUserId) return "You";
  if (log.authorType === "agent") {
    return log.authorId ? agentNames[log.authorId] ?? `Agent ${log.authorId.slice(0, 6)}` : "Agent";
  }
  if (log.authorType === "human") return "Teammate";
  return log.authorId ?? "System";
}

export function getMonogram(
  log: LogEntry,
  currentUserId: string,
  agentNames: Record<string, string>,
): string {
  if (log.authorType === "human") return log.authorId === currentUserId ? "ME" : "TM";
  const label = getAuthorLabel(log, currentUserId, agentNames);
  return label.slice(0, 2).toUpperCase();
}

type HastNode =
  | { type: "text"; value: string }
  | {
      type: "element";
      properties?: { className?: string[] };
      children?: unknown[];
    }
  | { type: "root"; children?: unknown[] };

function isHastNode(node: object): node is HastNode {
  const t = (node as { type?: unknown }).type;
  return t === "text" || t === "element" || t === "root";
}

function isTextHast(node: HastNode): node is Extract<HastNode, { type: "text" }> {
  return node.type === "text" && typeof (node as { value?: unknown }).value === "string";
}

/** Minimal hast → HTML for lowlight-highlighted fragments inside comment previews. */
export function hastToHtml(node: unknown): string {
  if (typeof node !== "object" || node === null) return "";
  if (!isHastNode(node)) return "";

  if (isTextHast(node)) {
    return node.value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  if (node.type === "element") {
    const cls = node.properties?.className;
    const clsAttr = cls?.length ? ` class="${cls.join(" ")}"` : "";
    const children = (node.children ?? []).map(hastToHtml).join("");
    return `<span${clsAttr}>${children}</span>`;
  }
  if (node.type === "root") {
    return (node.children ?? []).map(hastToHtml).join("");
  }
  return "";
}
