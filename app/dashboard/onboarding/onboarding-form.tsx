"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createBusiness } from "@/lib/grill-me/actions";
import type { GrillBusinessType } from "@/lib/grill-me/grill-prompt";

type Step = "path" | "name";

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("path");
  const [businessType, setBusinessType] = useState<GrillBusinessType | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choosePath(type: GrillBusinessType) {
    setBusinessType(type);
    setStep("name");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!businessType) {
      setError("Choose how you want to onboard first.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    setError(null);
    setPending(true);
    try {
      const { id } = await createBusiness(name);
      router.push(
        `/dashboard/grill-me/${id}?businessType=${encodeURIComponent(businessType)}`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create business");
    } finally {
      setPending(false);
    }
  }

  if (step === "path" || businessType === null) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Create a business</h1>
        <p className="text-muted-foreground text-sm">
          Grill-Me adapts its questions to whether you are documenting an existing operation or
          shaping a new product.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            data-testid="onboarding-path-existing"
            className="border-border hover:border-primary/50 hover:bg-muted/40 rounded-lg border p-4 text-left transition-colors"
            onClick={() => choosePath("existing")}
          >
            <span className="text-foreground block text-sm font-medium">Existing business</span>
            <span className="text-muted-foreground mt-1 block text-sm">
              Capture current stack, workflows, bottlenecks, and what to automate next.
            </span>
          </button>
          <button
            type="button"
            data-testid="onboarding-path-new"
            className="border-border hover:border-primary/50 hover:bg-muted/40 rounded-lg border p-4 text-left transition-colors"
            onClick={() => choosePath("new")}
          >
            <span className="text-foreground block text-sm font-medium">New project</span>
            <span className="text-muted-foreground mt-1 block text-sm">
              Clarify what you are building, for whom, tech choices, and MVP scope.
            </span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Name your business</h1>
      <p className="text-muted-foreground text-sm">
        You can change this later. Next, you will enter the Grill-Me chat for structured
        onboarding.
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
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            data-testid="onboarding-back"
            disabled={pending}
            onClick={() => {
              setStep("path");
              setBusinessType(null);
              setError(null);
            }}
          >
            Back
          </Button>
          <Button type="submit" data-testid="onboarding-submit" disabled={pending}>
            Continue to Grill-Me
          </Button>
        </div>
      </form>
    </main>
  );
}
