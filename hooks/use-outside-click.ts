"use client";

import { useEffect, type RefObject } from "react";

/** Closes a floating UI when the user clicks outside the given element ref. */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  open: boolean,
) {
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, ref, onClose]);
}
