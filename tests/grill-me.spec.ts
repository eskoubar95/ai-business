import { expect, test } from "@playwright/test";

const hasAuth =
  !!process.env.E2E_EMAIL?.trim() && !!process.env.E2E_PASSWORD?.trim();

test.describe("grill-me flow", () => {
  test.skip(
    !hasAuth,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated Grill-Me E2E.",
  );

  test("onboarding, three turns, soul preview", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.locator('input[type="email"]').first().fill(process.env.E2E_EMAIL!);
    await page
      .locator('input[type="password"]')
      .first()
      .fill(process.env.E2E_PASSWORD!);
    await page.getByRole("button", { name: /sign\s*in/i }).click();
    await page.waitForFunction(
      () => !window.location.pathname.includes("/auth/sign-in"),
      undefined,
      { timeout: 90_000 },
    );

    await page.goto("/dashboard/onboarding");
    await expect(page.getByTestId("onboarding-business-name")).toBeVisible({
      timeout: 30_000,
    });

    const name = `E2E Biz ${Date.now()}`;
    await page.getByTestId("onboarding-business-name").fill(name);
    await page.getByTestId("onboarding-submit").click();
    await page.waitForURL(/\/dashboard\/grill-me\/[0-9a-f-]+$/i, {
      timeout: 60_000,
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
