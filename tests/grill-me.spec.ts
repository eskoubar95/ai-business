import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./e2e-sign-in";

const hasAuth =
  !!process.env.E2E_EMAIL?.trim() && !!process.env.E2E_PASSWORD?.trim();

test.describe("grill-me flow", () => {
  test.skip(
    !hasAuth,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated Grill-Me E2E.",
  );

  test("onboarding, three turns, soul preview", async ({ page }) => {
    await signInWithCredentials(
      page,
      process.env.E2E_EMAIL!,
      process.env.E2E_PASSWORD!,
    );
    await page.waitForFunction(
      () => !window.location.pathname.includes("/auth/sign-in"),
      undefined,
      { timeout: 90_000 },
    );

    await page.goto("/dashboard/onboarding");
    await expect(page.getByTestId("onboarding-path-existing")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId("onboarding-path-existing").click();
    await expect(page.getByTestId("onboarding-business-name")).toBeVisible();

    const name = `E2E Biz ${Date.now()}`;
    await page.getByTestId("onboarding-business-name").fill(name);
    await page.getByTestId("onboarding-submit").click();
    await page.waitForURL(/\/dashboard\/grill-me\/[0-9a-f-]+/i, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });

    const input = page.getByTestId("grill-me-chat-input");
    const send = page.getByTestId("grill-me-send");

    await input.fill("First turn message");
    await send.click();
    await expect(page.getByText(/Assistant reply 1/i)).toBeVisible({
      timeout: 120_000,
    });

    await input.fill("Second turn message");
    await send.click();
    await expect(page.getByText(/Assistant reply 2/i)).toBeVisible({
      timeout: 120_000,
    });

    await input.fill("Third turn message");
    await send.click();
    await expect(page.getByTestId("grill-me-soul-preview")).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.getByTestId("grill-me-complete")).toBeVisible();
  });
});
