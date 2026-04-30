import type { ReactNode } from "react";

export function PageEmptyState({
  title,
  description,
  children,
  testId = "page-empty-state",
}: {
  title: string;
  description: string;
  children?: ReactNode;
  /** Override default `page-empty-state` for page-specific E2E selectors. */
  testId?: string;
}) {
  return (
    <div
      className="border-border bg-muted/30 flex flex-col gap-3 rounded-lg border border-dashed p-6"
      data-testid={testId}
    >
      <h2 className="text-foreground text-sm font-medium">{title}</h2>
      <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">{description}</p>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
