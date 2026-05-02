import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderBaseProps {
  className?: string;
}

interface PageHeaderTitleProps extends PageHeaderBaseProps {
  /** Dashboard flush header: h-14, title + optional description + optional action */
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: never;
  actions?: never;
}

interface PageHeaderBreadcrumbProps extends PageHeaderBaseProps {
  /** Detail page breadcrumb header (e.g. "Agents / New agent") */
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  title?: never;
  description?: never;
  action?: never;
}

type PageHeaderProps = PageHeaderTitleProps | PageHeaderBreadcrumbProps;

export function PageHeader(props: PageHeaderProps) {
  if ("title" in props && props.title) {
    const { title, description, action, className } = props;
    return (
      <div
        className={cn(
          "flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-6",
          className,
        )}
      >
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 text-[11px] text-muted-tier-secondary">{description}</p>
          ) : null}
        </div>
        {action ? (
          <div className="flex shrink-0 items-center gap-2">{action}</div>
        ) : null}
      </div>
    );
  }

  const { breadcrumb, actions, className } = props as PageHeaderBreadcrumbProps;
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
