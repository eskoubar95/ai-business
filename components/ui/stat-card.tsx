import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  className,
  accent = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  className?: string;
  accent?: "default" | "lime" | "amber" | "red";
}) {
  const iconColor =
    accent === "lime"
      ? "text-primary"
      : accent === "amber"
        ? "text-warning"
        : accent === "red"
          ? "text-destructive"
          : "text-muted-foreground";

  const iconBg =
    accent === "lime"
      ? "bg-primary/10"
      : accent === "amber"
        ? "bg-warning/10"
        : accent === "red"
          ? "bg-destructive/10"
          : "bg-white/[0.04]";

  return (
    <Card
      padding="px-4 py-3.5"
      interactive
      className={cn("group relative overflow-hidden", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="section-label">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </div>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            iconBg,
            iconColor,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
    </Card>
  );
}
