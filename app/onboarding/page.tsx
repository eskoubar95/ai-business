import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

import { OnboardingClient } from "./onboarding-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Get started — AI Business",
};

export default async function OnboardingPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");
  return <OnboardingClient />;
}
