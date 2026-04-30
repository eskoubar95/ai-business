import { cn } from "@/lib/utils";

export type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";

const priorityStyles: Record<Exclude<TaskPriority, "none">, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

export function PriorityBadge({
  priority,
  className,
  label,
}: {
  priority: TaskPriority;
  className?: string;
  label?: string;
}) {
  if (priority === "none") {
    return null;
  }

  const text = label ?? priority;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={text}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", priorityStyles[priority])}
        aria-hidden
      />
      <span className="text-muted-foreground sr-only">{text}</span>
    </span>
  );
}
