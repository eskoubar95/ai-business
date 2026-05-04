import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

import { OnboardingClient } from "./onboarding-client";
import OnboardingForm from "./onboarding-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Get started — AI Business",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ quick?: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");
  const sp = await searchParams;
  if (sp.quick === "1") {
    return <OnboardingForm />;
  }
  return <OnboardingClient />;
}
