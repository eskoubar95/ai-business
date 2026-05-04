import { expect, test } from "@playwright/test";

import { fillMarkdownEditor } from "./e2e-markdown-fill";
import { signInWithCredentials } from "./e2e-sign-in";

const hasAuth =
  !!process.env.E2E_EMAIL?.trim() && !!process.env.E2E_PASSWORD?.trim();
const hasSeedSecret = !!process.env.E2E_SETUP_SECRET?.trim();

test.describe("approvals queue", () => {
  test.describe.configure({ timeout: 8 * 60_000 });

  test.skip(
    !hasAuth || !hasSeedSecret,
    "Set E2E_EMAIL, E2E_PASSWORD, and E2E_SETUP_SECRET to run approvals E2E.",
  );

  test("pending approval appears, approve removes from queue", async ({ page }) => {
    test.setTimeout(8 * 60_000);
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

    await page.goto("/onboarding?quick=1");
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
      waitUntil: "domcontentloaded",
    });

    const grillUrl = page.url();
    const businessIdMatch = grillUrl.match(/\/dashboard\/grill-me\/([^/?]+)/i);
    expect(businessIdMatch?.[1]).toBeTruthy();
    const businessId = businessIdMatch![1];

    await page.goto(`/dashboard/agents/new?businessId=${businessId}`);
    await page.getByTestId("agent-name").fill("E2E Approval Agent");
    await page.getByTestId("agent-role").fill("Worker");
    const editor = page.getByTestId("agent-instructions-editor");
    await expect(editor).toBeVisible({ timeout: 60_000 });
    await fillMarkdownEditor(editor, "Instructions for approval E2E.");
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await page.getByTestId("agent-save").click();
    await page.waitForURL(/\/dashboard\/agents\/[0-9a-f-]+/i, {
      timeout: 120_000,
      waitUntil: "domcontentloaded",
    });

    const agentUrlMatch = page.url().match(/\/dashboard\/agents\/([^/?]+)/i);
    expect(agentUrlMatch?.[1]).toBeTruthy();
    const agentId = agentUrlMatch![1];

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
    const approvalCard = page.getByTestId(`approval-card-${approvalId}`);
    await expect(approvalCard).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByTestId("nav-approvals-pending-count")).toBeVisible();

    // Row actions use group-hover; approve does not use the reject textarea.
    await approvalCard.hover();
    await page.getByTestId(`approval-approve-${approvalId}`).click();

    await expect(page.getByTestId(`approval-card-${approvalId}`)).not.toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("approvals-board")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId(`approval-settled-${approvalId}`)).toBeVisible({
      timeout: 30_000,
    });

    await page.goto(`/dashboard/agents?businessId=${businessId}`);
    await expect(page.getByTestId(`agent-status-${agentId}`)).toContainText(/idle/i, {
      timeout: 30_000,
    });

    await page.goto(
      `/dashboard/settings?businessId=${businessId}&section=webhooks`,
    );
    await expect(page.getByTestId("webhook-deliveries-table")).toBeVisible();

    await page.goto(`/dashboard/settings?businessId=${businessId}&section=notion`);
    await expect(page.getByTestId("notion-connection-panel")).toBeVisible();
  });
});
