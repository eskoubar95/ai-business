import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

import OnboardingForm from "@/app/onboarding/onboarding-form";

export const dynamic = "force-dynamic";

/** Add another business while already in the dashboard (≥1 existing workspace). */
export default async function DashboardAddBusinessPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");
  return <OnboardingForm />;
}
