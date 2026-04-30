import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./e2e-sign-in";

const hasAuth =
  !!process.env.E2E_EMAIL?.trim() && !!process.env.E2E_PASSWORD?.trim();

test.describe("agent roster and teams", () => {
  test.skip(
    !hasAuth,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated roster E2E.",
  );

  test("agents, skills, MCP badge, team org chart", async ({ page }) => {
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
    await expect(page.getByTestId("onboarding-business-name")).toBeVisible({
      timeout: 30_000,
    });

    const bizName = `E2E Roster ${Date.now()}`;
    await page.getByTestId("onboarding-business-name").fill(bizName);
    await page.getByTestId("onboarding-submit").click();
    await page.waitForURL(/\/dashboard\/grill-me\/[0-9a-f-]+$/i, {
      timeout: 60_000,
    });

    const grillUrl = page.url();
    const businessIdMatch = grillUrl.match(/\/dashboard\/grill-me\/([^/?]+)/i);
    expect(businessIdMatch?.[1]).toBeTruthy();
    const businessId = businessIdMatch![1];

    async function createAgentViaForm(name: string, role: string) {
      await page.goto(`/dashboard/agents/new?businessId=${businessId}`);
      await page.getByTestId("agent-name").fill(name);
      await page.getByTestId("agent-role").fill(role);
      await page
        .getByTestId("agent-instructions-editor")
        .locator("textarea")
        .fill(`${name} instructions`);
      await page.getByTestId("agent-save").click();
      await page.waitForURL(/\/dashboard\/agents\/[0-9a-f-]+\/edit/i, {
        timeout: 60_000,
      });
    }

    await createAgentViaForm("E2E Lead", "Lead");
    await page.getByTestId("agent-instructions-editor").locator("textarea").fill(
      "Updated lead instructions for E2E.",
    );
    await page.getByTestId("agent-save").click();
    await expect(page.getByTestId("skill-create-toggle")).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("skill-create-toggle").click();
    await page.getByTestId("skill-new-name").fill("E2E Skill");
    await page
      .getByTestId("skill-manager")
      .locator(".markdown-editor-field textarea")
      .fill("Skill body");
    await page.getByTestId("skill-create-submit").click();
    await expect(page.locator('[data-testid^="skill-attached-"]').first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTestId("mcp-install-open").click();
    await expect(page.getByTestId("mcp-install-modal")).toBeVisible();
    await page.getByTestId("mcp-field-token").fill("ghp_dummy_token_for_e2e");
    await page.getByTestId("mcp-field-defaultOrg").fill("acme");
    await page.getByTestId("mcp-install-submit").click();
    await expect(page.getByTestId("mcp-badge-github")).toBeVisible({ timeout: 30_000 });

    await createAgentViaForm("E2E Member One", "Member");
    await createAgentViaForm("E2E Member Two", "Member");

    await page.goto(`/dashboard/agents?businessId=${businessId}`);
    await expect(page.getByTestId("agents-roster")).toBeVisible();
    const leadCard = page.locator('[data-testid^="agent-card-"]').filter({
      hasText: "E2E Lead",
    });
    await expect(leadCard).toBeVisible();
    await expect(leadCard.locator('[data-testid^="agent-skills-count-"]')).toContainText("1");
    await expect(leadCard.locator('[data-testid^="agent-mcp-count-"]')).toContainText("1");

    await page.goto(`/dashboard/teams/new?businessId=${businessId}`);
    await page.getByTestId("team-name").fill(`E2E Team ${Date.now()}`);
    await page.getByTestId("team-lead").selectOption({ label: "E2E Lead" });
    await page.getByTestId("team-member-a").selectOption({ label: "E2E Member One" });
    await page.getByTestId("team-member-b").selectOption({ label: "E2E Member Two" });
    await page.getByTestId("team-create-submit").click();
    await page.waitForURL(/\/dashboard\/teams\/[0-9a-f-]+/i, { timeout: 60_000 });

    await expect(page.getByTestId("org-chart")).toBeVisible();
    await expect(page.locator('[data-testid^="org-node-"]').first()).toBeVisible();
    await expect(page.getByText("E2E Lead")).toBeVisible();
    await expect(page.getByText("E2E Member One")).toBeVisible();
    await expect(page.getByText("E2E Member Two")).toBeVisible();
    await expect(page.getByTestId("team-lead-label")).toContainText("E2E Lead");
  });
});
