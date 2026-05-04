/** True for `/onboarding` (and nested segments under that path). */
export function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

/** Add **another** business from the dashboard (user is expected to already have ≥1). */
export function isDashboardAddBusinessPath(pathname: string): boolean {
  return (
    pathname === "/dashboard/onboarding" ||
    pathname.startsWith("/dashboard/onboarding/")
  );
}
