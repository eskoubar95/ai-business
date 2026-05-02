import { cn } from "@/lib/utils";

export type StatusBadgeColor =
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "gray"
  | "violet"
  | "lime";

interface StatusBadgeProps {
  label: string;
  color?: StatusBadgeColor;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

const colorMap: Record<StatusBadgeColor, { dot: string; text: string; bg: string; border: string }> = {
  lime: {
    dot: "bg-status-active",
    text: "text-status-active",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  green: {
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  amber: {
    dot: "bg-warning",
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
  red: {
    dot: "bg-destructive",
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
  },
  blue: {
    dot: "bg-blue-400",
    text: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  violet: {
    dot: "bg-violet-400",
    text: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  gray: {
    dot: "bg-status-idle",
    text: "text-muted-foreground",
    bg: "bg-white/[0.05]",
    border: "border-border",
  },
};

/**
 * Flexible status/label badge pill.
 * Renders an optional colored dot indicator + label text.
 * Pass `dot={false}` to hide the dot for text-only labels.
 */
export function StatusBadge({
  label,
  color = "gray",
  dot = true,
  pulse = false,
  className,
}: StatusBadgeProps) {
  const c = colorMap[color];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5",
        "font-mono text-[10px] font-medium uppercase tracking-wide",
        c.bg,
        c.border,
        c.text,
        className,
      )}
    >
      {dot ? (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", c.dot, pulse && "animate-pulse")}
          aria-hidden
        />
      ) : null}
      {label}
    </span>
  );
}
