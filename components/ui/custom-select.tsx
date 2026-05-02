"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  id: string;
  label: string;
  description?: string;
  prefix?: React.ReactNode;
};

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  "data-testid"?: string;
};

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  "data-testid": testId,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative" data-testid={testId}>
      {/* Trigger */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md",
          "border border-border bg-transparent px-3",
          "text-[13px] transition-colors",
          "disabled:pointer-events-none disabled:opacity-40",
          open
            ? "border-white/[0.18] text-foreground"
            : "text-foreground hover:border-white/[0.14]",
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-2", !selected && "text-muted-foreground/40")}>
          {selected?.prefix && <span className="shrink-0">{selected.prefix}</span>}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[180px]",
            "rounded-md border border-white/[0.10] bg-popover shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 duration-100",
          )}
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "bg-white/[0.05] text-foreground"
                      : "text-muted-foreground/70 hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  {/* Check indicator */}
                  <span
                    className={cn(
                      "mt-[1px] flex size-3.5 shrink-0 items-center justify-center",
                      isSelected ? "text-primary" : "text-transparent",
                    )}
                  >
                    <Check className="size-3 stroke-[2.5]" />
                  </span>

                  <span className="flex items-center gap-2">
                    {opt.prefix && <span className="shrink-0">{opt.prefix}</span>}
                    <span className="flex flex-col gap-0.5">
                      <span className={cn("text-[13px] leading-tight", isSelected && "font-medium text-foreground")}>
                        {opt.label}
                      </span>
                      {opt.description && (
                        <span className="text-[11px] leading-snug text-muted-foreground/40">
                          {opt.description}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
