import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  breadcrumb,
  actions,
  className,
}: {
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "border-border flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4",
        className,
      )}
    >
      <div className="text-muted-foreground min-w-0 text-sm">{breadcrumb}</div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
    </header>
  );
}
