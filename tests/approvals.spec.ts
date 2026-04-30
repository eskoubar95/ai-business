import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./e2e-sign-in";

const hasAuth =
  !!process.env.E2E_EMAIL?.trim() && !!process.env.E2E_PASSWORD?.trim();
const hasSeedSecret = !!process.env.E2E_SETUP_SECRET?.trim();

test.describe("approvals queue", () => {
  test.describe.configure({ timeout: 15 * 60_000 });

  test.skip(
    !hasAuth || !hasSeedSecret,
    "Set E2E_EMAIL, E2E_PASSWORD, and E2E_SETUP_SECRET to run approvals E2E.",
  );

  test("pending approval appears, approve removes from queue", async ({ page }) => {
    test.setTimeout(15 * 60_000);
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

    const bizName = `E2E Approvals ${Date.now()}`;
    await page.getByTestId("onboarding-business-name").fill(bizName);
    await page.getByTestId("onboarding-submit").click();
    await page.waitForURL(/\/dashboard\/grill-me\/[0-9a-f-]+/i, {
      timeout: 120_000,
    });

    const grillUrl = page.url();
    const businessIdMatch = grillUrl.match(/\/dashboard\/grill-me\/([^/?]+)/i);
    expect(businessIdMatch?.[1]).toBeTruthy();
    const businessId = businessIdMatch![1];

    await page.goto(`/dashboard/agents/new?businessId=${businessId}`);
    await page.getByTestId("agent-name").fill("E2E Approval Agent");
    await page.getByTestId("agent-role").fill("Worker");
    await page
      .getByTestId("agent-instructions-editor")
      .locator("textarea")
      .fill("Instructions for approval E2E.");
    await page.getByTestId("agent-save").click();
    await page.waitForURL(/\/dashboard\/agents\/[0-9a-f-]+\/edit/i, {
      timeout: 60_000,
    });

    const editMatch = page.url().match(/\/dashboard\/agents\/([^/?]+)\/edit/i);
    expect(editMatch?.[1]).toBeTruthy();
    const agentId = editMatch![1];

    const seedRes = await page.request.post("/api/e2e/seed-approval", {
      data: { businessId, agentId },
      headers: {
        "Content-Type": "application/json",
        "x-e2e-secret": process.env.E2E_SETUP_SECRET!,
      },
    });
    expect(seedRes.ok(), await seedRes.text()).toBeTruthy();
    const { id: approvalId } = (await seedRes.json()) as { id: string };
    expect(approvalId).toMatch(/^[0-9a-f-]{36}$/i);

    await page.goto(`/dashboard/approvals?businessId=${businessId}`);
    await expect(page.getByTestId(`approval-card-${approvalId}`)).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByTestId("nav-approvals-pending-count")).toBeVisible();

    await page.getByTestId(`approval-comment-${approvalId}`).fill("E2E approve comment");
    await page.getByTestId(`approval-approve-${approvalId}`).click();

    await expect(page.getByTestId(`approval-card-${approvalId}`)).not.toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("approvals-empty")).toBeVisible({ timeout: 30_000 });

    await page.goto(`/dashboard/agents?businessId=${businessId}`);
    await expect(page.getByTestId(`agent-status-${agentId}`)).toContainText(/idle/i, {
      timeout: 30_000,
    });

    await page.goto(`/dashboard/webhooks?businessId=${businessId}`);
    await expect(page.getByTestId("webhook-deliveries-table")).toBeVisible();

    await page.goto(`/dashboard/notion?businessId=${businessId}`);
    await expect(page.getByTestId("notion-connection-panel")).toBeVisible();
  });
});
