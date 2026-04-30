import type { Page } from "@playwright/test";

/** Submit control on Neon Auth sign-in is labeled "Login" in current UI (not "Sign in"). */
export async function signInWithCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/sign-in");
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /login|sign\s*in/i }).click();
}
