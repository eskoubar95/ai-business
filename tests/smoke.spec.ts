import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home returns 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("sign-in page shows email input", async ({ page }) => {
    await page.goto("/auth/sign-in");
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });
});
