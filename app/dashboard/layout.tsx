import { headers } from "next/headers";

import { redirectToOnboardingIfNoBusinesses } from "@/lib/dashboard/business-scope";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname");
  await redirectToOnboardingIfNoBusinesses(pathname);
  return <>{children}</>;
}
