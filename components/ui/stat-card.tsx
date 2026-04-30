import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card hover:border-primary/30 group cursor-default rounded-lg border p-4 shadow-xs transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="bg-accent text-primary ring-border/50 flex size-10 items-center justify-center rounded-md ring-1">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </div>
          <div className="text-muted-foreground mt-1 text-xs font-medium">{label}</div>
        </div>
      </div>
    </div>
  );
}
