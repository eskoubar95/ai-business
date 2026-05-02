"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Size = "sm" | "md" | "lg";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  size?: Size;
  type?: "button" | "submit" | "reset";
  className?: string;
  "data-testid"?: string;
}

const SIZE_CLASSES: Record<Size, { button: string; icon: string; spinner: string }> = {
  sm: { button: "h-7 gap-1 px-2.5 text-[12px]", icon: "size-3", spinner: "size-3" },
  md: { button: "h-8 gap-1.5 px-3 text-[13px]", icon: "size-3.5", spinner: "size-3.5" },
  lg: { button: "h-9 gap-1.5 px-4 text-[13px]", icon: "size-4", spinner: "size-4" },
};

/**
 * The definitive primary CTA button. Uses a gradient border + subtle gradient fill
 * identical to the "Run Sprint" button pattern established in the design system.
 *
 * Use for all primary actions: Save, Create, Submit, Connect, Run, etc.
 * Do NOT use for small icon buttons, status dots, or chip backgrounds.
 */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  icon: Icon,
  size = "md",
  type = "button",
  className,
  "data-testid": dataTestId,
}: PrimaryButtonProps) {
  const sizes = SIZE_CLASSES[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={dataTestId}
      className={cn(
        "group relative flex items-center font-medium text-white transition-all duration-200 rounded-md",
        "disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        sizes.button,
        className,
      )}
      style={{
        border: "1px solid transparent",
        background:
          "linear-gradient(#141414, #141414) padding-box, linear-gradient(135deg, rgba(168,235,18,0.8) 0%, rgba(80,140,0,0.5) 100%) border-box",
      }}
    >
      {/* Resting fill — subtle lime wash */}
      <span
        className="absolute inset-0 rounded-md transition-opacity duration-200"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,235,18,0.18) 0%, rgba(80,140,0,0.08) 100%)",
          opacity: 1,
        }}
      />
      {/* Hover fill — slightly brighter */}
      <span
        className="absolute inset-0 rounded-md opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,235,18,0.28) 0%, rgba(80,140,0,0.14) 100%)",
        }}
      />
      {loading ? (
        <span
          className={cn(
            "relative shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white",
            sizes.spinner,
          )}
        />
      ) : (
        Icon && <Icon className={cn("relative shrink-0 text-primary", sizes.icon)} />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
