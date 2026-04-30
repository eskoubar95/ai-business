"use client";

import { useState } from "react";

export function InputForm({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = value.trim();
    if (!t || disabled) return;
    setValue("");
    onSend(t);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        data-testid="grill-me-chat-input"
        className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring min-h-[96px] w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus-visible:ring-2"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe your business…"
      />
      <button
        type="submit"
        data-testid="grill-me-send"
        disabled={disabled || !value.trim()}
        className="bg-foreground text-background hover:opacity-90 inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium shadow-sm transition-opacity disabled:pointer-events-none disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}
