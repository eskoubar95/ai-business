"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { saveUserSettings } from "@/lib/settings/actions";
import { PrimaryButton } from "@/components/ui/primary-button";
import { cn } from "@/lib/utils";

type KeyStripState = "idle" | "checking" | "success" | "error";

export function SettingsAccountSection({ hasCursorApiKey }: { hasCursorApiKey: boolean }) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [strip, setStrip] = useState<KeyStripState>("idle");
  const [stripMessage, setStripMessage] = useState<string | null>(null);
  const [accountPending, startAccountSave] = useTransition();

  useEffect(() => {
    if (strip !== "success") return;
    const t = setTimeout(() => {
      setStrip("idle");
      setStripMessage(null);
    }, 6000);
    return () => clearTimeout(t);
  }, [strip]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    startAccountSave(async () => {
      const trimmed = apiKey.trim();

      setStrip("checking");
      setStripMessage(null);

      const result = await saveUserSettings(apiKey);

      if (result.success) {
        if (!trimmed) {
          setStrip("idle");
          setStripMessage(null);
          toast.success("Saved key cleared.");
        } else {
          toast.success("Key verified and saved.");
          setApiKey("");
          setShowKey(false);
          setStrip("success");
          setStripMessage("Your key passed Cursor verification and was stored encrypted.");
        }
      } else {
        toast.error(result.message);
        setStrip("error");
        setStripMessage(result.message);
      }
    });
  }

  return (
    <section className="flex max-w-md flex-col gap-5">
      {hasCursorApiKey ? (
        <p className="text-[12px] text-muted-foreground/50" data-testid="settings-api-key-saved">
          A Cursor API key is already saved. Paste a replacement and choose{" "}
          <span className="text-foreground/60 font-medium">Validate &amp; save</span>, or clear the field
          and submit to remove it.
        </p>
      ) : null}
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end justify-between gap-2">
            <label htmlFor="cursorApiKey" className="label-upper">
              Cursor API key
            </label>
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="text-[11px] text-muted-foreground/60 hover:text-foreground/75 underline underline-offset-2 shrink-0"
            >
              {showKey ? "Hide key" : "Show key"}
            </button>
          </div>
          <input
            id="cursorApiKey"
            type={showKey ? "text" : "password"}
            name="cursorApiKey"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              if (strip === "checking") return;
              if (strip === "success" || strip === "error") {
                setStrip("idle");
                setStripMessage(null);
              }
            }}
            disabled={accountPending}
            aria-busy={accountPending}
            className={cn(
              "h-9 rounded-md border bg-white/[0.04] px-3 font-mono text-[13px] text-foreground/80 placeholder:text-muted-foreground/30 focus:border-white/[0.16] focus:outline-none transition-colors disabled:opacity-50",
              strip === "error" ? "border-red-500/35" : "border-border",
            )}
            placeholder="sk-cursor-…"
          />
        </div>

        <div
          role="status"
          aria-live="polite"
          className={cn(
            "rounded-lg border px-3 py-2.5 text-[12px] leading-snug transition-colors min-h-[44px]",
            strip === "idle" && "border-border/50 bg-muted/20 text-muted-foreground/70",
            strip === "checking" && "border-primary/35 bg-primary/[0.06] text-primary/90 flex items-start gap-2",
            strip === "success" && "border-green-500/35 bg-green-500/[0.06] text-green-400/90 flex items-start gap-2",
            strip === "error" && "border-red-500/35 bg-red-500/[0.05] text-red-400/90 flex items-start gap-2",
          )}
        >
          {strip === "idle" && (
            <span>
              We call Cursor to verify keys before encrypting them. Leave the field empty and submit to
              clear a saved key.
            </span>
          )}
          {strip === "checking" && (
            <>
              <Loader2 className="size-3.5 shrink-0 mt-0.5 animate-spin" />
              <span>
                {apiKey.trim().length
                  ? "Checking your key with Cursor…"
                  : "Removing the saved key from your account…"}
              </span>
            </>
          )}
          {strip === "success" && (
            <>
              <Check className="size-3.5 shrink-0 mt-0.5 stroke-[2.25]" />
              <span>{stripMessage}</span>
            </>
          )}
          {strip === "error" && (
            <>
              <X className="size-3.5 shrink-0 mt-0.5 stroke-[2.25]" />
              <span>{stripMessage}</span>
            </>
          )}
        </div>

        <div>
          <PrimaryButton type="submit" disabled={accountPending} loading={accountPending} size="md">
            {accountPending ? "Checking…" : "Validate & save"}
          </PrimaryButton>
        </div>
      </form>
    </section>
  );
}
