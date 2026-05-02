"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export type LoadingButtonProps = ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export function LoadingButton({
  className,
  loading = false,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      className={cn(className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Loader2 className="text-current size-4 animate-spin" aria-hidden /> : null}
      {loading ? <span className="sr-only">Loading</span> : null}
      {children}
    </Button>
  );
}
