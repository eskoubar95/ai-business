import { describe, expect, it } from "vitest";

import { isDashboardAddBusinessPath, isOnboardingPath } from "../onboarding-path";

describe("isOnboardingPath", () => {
  it("allows exact onboarding route", () => {
    expect(isOnboardingPath("/onboarding")).toBe(true);
  });

  it("allows nested onboarding segments", () => {
    expect(isOnboardingPath("/onboarding/foo")).toBe(true);
  });

  it("rejects dashboard and other paths", () => {
    expect(isOnboardingPath("/dashboard")).toBe(false);
    expect(isOnboardingPath("/dashboard/onboarding")).toBe(false);
    expect(isOnboardingPath("/dashboard/agents")).toBe(false);
  });
});

describe("isDashboardAddBusinessPath", () => {
  it("matches dashboard add-business route", () => {
    expect(isDashboardAddBusinessPath("/dashboard/onboarding")).toBe(true);
    expect(isDashboardAddBusinessPath("/dashboard/onboarding/x")).toBe(true);
  });

  it("does not match first-time onboarding", () => {
    expect(isDashboardAddBusinessPath("/onboarding")).toBe(false);
  });
});
