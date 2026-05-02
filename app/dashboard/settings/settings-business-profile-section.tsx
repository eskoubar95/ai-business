"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Globe, ImageIcon } from "lucide-react";

import { saveBusinessProfile } from "@/lib/settings/actions";
import type { SettingsBusinessRow } from "@/lib/settings/actions";
import { PrimaryButton } from "@/components/ui/primary-button";

export function SettingsBusinessProfileSection({
  businessId,
  business,
}: {
  businessId: string;
  business: SettingsBusinessRow;
}) {
  const [name, setName] = useState(business.name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(business.websiteUrl ?? "");
  const [description, setDescription] = useState(business.description ?? "");
  const [pending, startSave] = useTransition();

  useEffect(() => {
    setName(business.name ?? "");
    setWebsiteUrl(business.websiteUrl ?? "");
    setDescription(business.description ?? "");
  }, [business]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    startSave(async () => {
      const result = await saveBusinessProfile(businessId, {
        name: name.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        description: description.trim() || undefined,
      });
      if (result.success) toast.success("Business profile saved.");
      else toast.error("Could not save.");
    });
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-5">
      {/* Business name */}
      <div>
        <label className="mb-1.5 block label-upper">Business name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your business name"
          disabled={pending}
          className="h-9 w-full rounded-md border border-border bg-white/[0.04] px-3 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:border-white/[0.16] focus:outline-none transition-colors disabled:opacity-50"
        />
      </div>

      {/* Website URL */}
      <div>
        <label className="mb-1.5 block label-upper">Website</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/30 pointer-events-none" />
          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourbusiness.com"
            disabled={pending}
            className="h-9 w-full rounded-md border border-border bg-white/[0.04] pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:border-white/[0.16] focus:outline-none transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block label-upper">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of your business..."
          disabled={pending}
          rows={3}
          className="w-full rounded-md border border-border bg-white/[0.04] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:border-white/[0.16] focus:outline-none transition-colors disabled:opacity-50 resize-none"
        />
      </div>

      {/* Logo — placeholder (coming soon) */}
      <div>
        <label className="mb-1.5 block label-upper">
          Logo{" "}
          <span className="normal-case tracking-normal text-muted-tier-faint">(coming soon)</span>
        </label>
        <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-white/[0.10] bg-white/[0.02] text-muted-foreground/20">
          <ImageIcon className="size-5" />
        </div>
      </div>

      {/* Future fields hint */}
      <p className="text-muted-tier-faint text-[11px] leading-relaxed">
        More fields coming — vision, goals, target audience, and brand voice will be configurable here.
      </p>

      <div>
        <PrimaryButton type="submit" disabled={pending || !name.trim()} loading={pending}>
          {pending ? "Saving..." : "Save profile"}
        </PrimaryButton>
      </div>
    </form>
  );
}
