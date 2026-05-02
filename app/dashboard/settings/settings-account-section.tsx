"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveUserSettings } from "@/lib/settings/actions";
import { PrimaryButton } from "@/components/ui/primary-button";

export function SettingsAccountSection({ hasCursorApiKey }: { hasCursorApiKey: boolean }) {
  const [apiKey, setApiKey] = useState("");
  const [accountPending, startAccountSave] = useTransition();

  async function onSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    startAccountSave(async () => {
      const result = await saveUserSettings(apiKey);
      if (result.success) {
        toast.success("Account settings saved.");
        setApiKey("");
      } else {
        toast.error("Could not save account settings.");
      }
    });
  }

  return (
    <section className="flex max-w-md flex-col gap-5">
      {hasCursorApiKey ? (
        <p className="text-[12px] text-muted-foreground/50" data-testid="settings-api-key-saved">
          A Cursor API key is already saved. Enter a new key below to replace it, or clear the field
          and save to remove it.
        </p>
      ) : null}
      <form onSubmit={onSaveAccount} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cursorApiKey" className="label-upper">
            Cursor API key
          </label>
          <input
            id="cursorApiKey"
            type="password"
            name="cursorApiKey"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="h-9 rounded-md border border-border bg-white/[0.04] px-3 text-[13px] text-foreground/80 placeholder:text-muted-foreground/30 focus:border-white/[0.16] focus:outline-none transition-colors disabled:opacity-50"
            placeholder="••••••••"
            disabled={accountPending}
          />
        </div>
        <div>
          <PrimaryButton type="submit" disabled={accountPending} loading={accountPending}>
            {accountPending ? "Saving…" : "Save account settings"}
          </PrimaryButton>
        </div>
      </form>
    </section>
  );
}
