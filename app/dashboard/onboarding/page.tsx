import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

import OnboardingForm from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");
  return <OnboardingForm />;
}
