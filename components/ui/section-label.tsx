import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Renders a section/panel label using the `.section-label` design token class:
 * 10px mono uppercase caps — consistent with Supabase-style panel headers.
 */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("section-label", className)}>{children}</p>;
}
