"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { saveUserSettings } from "@/lib/settings/actions";

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
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">Account</h2>
        <p className="text-muted-foreground text-sm">
          Cursor API key for local runner integration. API key is encrypted and stored securely.
        </p>
      </div>
      {hasCursorApiKey ? (
        <p className="text-muted-foreground text-sm" data-testid="settings-api-key-saved">
          A Cursor API key is saved for your account. Enter a new key below to replace it, or clear the
          field and save to remove the stored key.
        </p>
      ) : null}
      <form onSubmit={onSaveAccount} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Cursor API key
          <input
            type="password"
            name="cursorApiKey"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            placeholder="••••••••"
            disabled={accountPending}
          />
        </label>
        <Button type="submit" disabled={accountPending} className="cursor-pointer">
          Save account settings
        </Button>
      </form>
    </section>
  );
}
