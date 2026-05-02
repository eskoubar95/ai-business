"use client";

import { X } from "lucide-react";
import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RightPanel({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="bg-background/60 animate-in fade-in fixed inset-0 z-40 backdrop-blur-sm duration-150"
        aria-label="Close panel"
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "border-border bg-card animate-in slide-in-from-right fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l shadow-xl duration-200 ease-out md:top-0",
          className,
        )}
      >
        <div className="border-border flex items-start justify-between gap-2 border-b px-4 py-3">
          <div className="min-w-0 text-base font-semibold">{title}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}
