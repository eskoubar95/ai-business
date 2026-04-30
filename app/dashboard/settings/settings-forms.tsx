"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SettingsBusinessRow } from "@/lib/settings/actions";
import { saveBusinessSettings, saveUserSettings } from "@/lib/settings/actions";

export function SettingsForms({
  businesses,
  initialBusinessId,
  hasCursorApiKey,
}: {
  businesses: SettingsBusinessRow[];
  initialBusinessId: string | null;
  hasCursorApiKey: boolean;
}) {
  const [apiKey, setApiKey] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [businessId, setBusinessId] = useState(initialBusinessId ?? "");
  const [accountPending, startAccountSave] = useTransition();
  const [businessPending, startBusinessSave] = useTransition();

  useEffect(() => {
    const b = businesses.find((x) => x.id === businessId);
    if (!b) return;
    setLocalPath(b.localPath ?? "");
    setGithubRepoUrl(b.githubRepoUrl ?? "");
    setDescription(b.description ?? "");
  }, [businessId, businesses]);

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

  async function onSaveBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) {
      toast.error("Select a business first.");
      return;
    }
    startBusinessSave(async () => {
      const result = await saveBusinessSettings(businessId, {
        localPath: localPath.trim() || undefined,
        githubRepoUrl: githubRepoUrl.trim() || undefined,
        description: description.trim() || undefined,
      });
      if (result.success) {
        toast.success("Business settings saved.");
      } else {
        toast.error("Could not save business settings.");
      }
    });
  }

  if (businesses.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Create a business from “New business” before configuring workspace paths.
      </p>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Account</h2>
          <p className="text-muted-foreground text-sm">
            Cursor API key for local runner integration. API key is encrypted and stored securely.
          </p>
        </div>
        {hasCursorApiKey ? (
          <p
            className="text-muted-foreground text-sm"
            data-testid="settings-api-key-saved"
          >
            A Cursor API key is saved for your account. Enter a new key below to replace it, or
            clear the field and save to remove the stored key.
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
          <Button type="submit" disabled={accountPending}>
            Save account settings
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Business</h2>
          <p className="text-muted-foreground text-sm">
            Workspace defaults for the selected tenant.
          </p>
        </div>
        <form onSubmit={onSaveBusiness} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-foreground font-medium">Business</span>
            <Select value={businessId} onValueChange={setBusinessId}>
              <SelectTrigger className="w-[220px]" data-testid="settings-business-select">
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Local path
            <input
              name="localPath"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
              placeholder="/path/to/repo"
              disabled={businessPending}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            GitHub repository URL
            <input
              name="githubRepoUrl"
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
              placeholder="https://github.com/org/repo"
              disabled={businessPending}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Description
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-input bg-background min-h-[88px] rounded-md border px-3 py-2 text-sm"
              placeholder="Short notes for this workspace"
              disabled={businessPending}
            />
          </label>
          <Button type="submit" disabled={businessPending || !businessId}>
            Save business settings
          </Button>
        </form>
      </section>
    </div>
  );
}
