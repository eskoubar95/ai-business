import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./e2e-sign-in";

const hasAuth =
  !!process.env.E2E_EMAIL?.trim() && !!process.env.E2E_PASSWORD?.trim();

test.describe("tasks UI", () => {
  test.describe.configure({ timeout: 15 * 60_000 });

  test.skip(!hasAuth, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated tasks E2E.");

  test("create task, backlog column, comment in feed", async ({ page }) => {
    test.setTimeout(15 * 60_000);
    await signInWithCredentials(page, process.env.E2E_EMAIL!, process.env.E2E_PASSWORD!);
    await page.waitForFunction(
      () => !window.location.pathname.includes("/auth/sign-in"),
      undefined,
      { timeout: 90_000 },
    );

    await page.goto("/dashboard/onboarding");
    await expect(page.getByTestId("onboarding-business-name")).toBeVisible({
      timeout: 30_000,
    });

    const bizName = `E2E Tasks ${Date.now()}`;
    await page.getByTestId("onboarding-business-name").fill(bizName);
    await page.getByTestId("onboarding-submit").click();
    await page.waitForURL(/\/dashboard\/grill-me\/[0-9a-f-]+$/i, {
      timeout: 120_000,
    });

    const grillUrl = page.url();
    const businessIdMatch = grillUrl.match(/\/dashboard\/grill-me\/([^/?]+)/i);
    expect(businessIdMatch?.[1]).toBeTruthy();
    const businessId = businessIdMatch![1];

    await page.goto(`/dashboard/tasks/new?businessId=${businessId}`);
    await expect(page.getByTestId("task-create-form")).toBeVisible({ timeout: 60_000 });

    const title = `E2E Task ${Date.now()}`;
    await page.getByTestId("task-new-title").fill(title);
    await page.getByTestId("task-new-description").fill("Hello **world**");
    await page.getByTestId("task-new-submit").click();

    await expect(page.getByTestId("task-detail-title")).toHaveText(title, {
      timeout: 60_000,
    });

    await page.goto(`/dashboard/tasks?businessId=${businessId}`);
    await expect(page.getByTestId("task-status-board")).toBeVisible({ timeout: 60_000 });
    const backlog = page.getByTestId("task-column-backlog");
    await expect(backlog.getByTestId(/^task-card-/)).toContainText(title);

    await backlog.locator('[data-testid^="task-card-"]').filter({ hasText: title }).click();
    await expect(page.getByTestId("task-detail-title")).toHaveText(title);

    await page.getByTestId("task-comment-body").fill("Smoke comment from E2E");
    await page.getByTestId("task-comment-submit").click();
    await expect(page.getByTestId("task-log-feed")).toContainText("Smoke comment from E2E", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("task-log-feed")).toContainText("You");
  });
});
