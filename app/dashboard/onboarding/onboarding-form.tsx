"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createBusiness } from "@/lib/grill-me/actions";

export default function OnboardingForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    setError(null);
    setPending(true);
    try {
      const { id } = await createBusiness(name);
      router.push(`/dashboard/grill-me/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create business");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Create a business</h1>
      <p className="text-muted-foreground text-sm">
        Start Grill-Me onboarding for a new tenant.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Business name
          <input
            name="name"
            data-testid="onboarding-business-name"
            required
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            placeholder="Acme AI"
            disabled={pending}
          />
        </label>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button type="submit" data-testid="onboarding-submit" disabled={pending}>
          Continue to Grill-Me
        </Button>
      </form>
    </main>
  );
}
