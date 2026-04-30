"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { SettingsBusinessRow } from "@/lib/settings/actions";
import { saveBusinessSettings } from "@/lib/settings/actions";

export function SettingsBusinessSection({
  businessId,
  business,
}: {
  businessId: string;
  business: SettingsBusinessRow;
}) {
  const [localPath, setLocalPath] = useState(business.localPath ?? "");
  const [githubRepoUrl, setGithubRepoUrl] = useState(business.githubRepoUrl ?? "");
  const [description, setDescription] = useState(business.description ?? "");
  const [businessPending, startBusinessSave] = useTransition();

  useEffect(() => {
    setLocalPath(business.localPath ?? "");
    setGithubRepoUrl(business.githubRepoUrl ?? "");
    setDescription(business.description ?? "");
  }, [business]);

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

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">Business</h2>
        <p className="text-muted-foreground text-sm">
          Workspace defaults for <span className="text-foreground font-medium">{business.name}</span>.
        </p>
      </div>
      <form onSubmit={onSaveBusiness} className="flex flex-col gap-4">
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
        <Button type="submit" disabled={businessPending} className="cursor-pointer">
          Save business settings
        </Button>
      </form>
    </section>
  );
}
