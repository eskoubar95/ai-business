"use client";

import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/tasks/task-detail-display";

/** Linear-style SVG priority icons for task detail dropdowns. */
export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  if (priority === "none")
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={cn("shrink-0", className)}>
        <rect x="1" y="6.5" width="2.5" height="1.5" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="5.75" y="6.5" width="2.5" height="1.5" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="10.5" y="6.5" width="2.5" height="1.5" rx="0.5" fill="currentColor" opacity="0.35" />
      </svg>
    );
  if (priority === "urgent")
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={cn("shrink-0", className)}>
        <rect x="1" y="1" width="12" height="12" rx="3" fill="currentColor" opacity="0.18" />
        <rect x="6.25" y="3" width="1.5" height="5.5" rx="0.75" fill="currentColor" />
        <circle cx="7" cy="10.5" r="0.85" fill="currentColor" />
      </svg>
    );
  const filled = priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  const heights = [10, 7.5, 5, 3];
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={cn("shrink-0", className)}>
      {[0, 1, 2, 3].map((i) => {
        const h = heights[i]!;
        const x = 1 + i * 3.25;
        const active = 4 - i <= filled;
        return (
          <rect
            key={i}
            x={x}
            y={14 - h - 1}
            width="2.5"
            height={h}
            rx="0.6"
            fill="currentColor"
            opacity={active ? 1 : 0.2}
          />
        );
      })}
    </svg>
  );
}
