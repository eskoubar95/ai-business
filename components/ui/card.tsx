import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardTag = "div" | "li" | "article" | "section";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Inner padding — Tailwind padding class, default `p-5` */
  padding?: string;
  /** Adds cursor-pointer + border/bg lift on hover */
  interactive?: boolean;
  /** Rendered HTML element */
  as?: CardTag;
}

export function Card({
  children,
  className,
  padding = "p-5",
  interactive = false,
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-md border border-border bg-card",
        padding,
        interactive &&
          "cursor-pointer transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.02]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
