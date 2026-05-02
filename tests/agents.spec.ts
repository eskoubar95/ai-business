import { expect, test } from "@playwright/test";

import { fillMarkdownEditor } from "./e2e-markdown-fill";
import { signInWithCredentials } from "./e2e-sign-in";

const hasAuth =
  !!process.env.E2E_EMAIL?.trim() && !!process.env.E2E_PASSWORD?.trim();

test.describe("agent roster and teams", () => {
  // Suite stays generous for cold webpack; individual steps use shorter expect timeouts.
  test.describe.configure({ timeout: 8 * 60_000 });

  test.skip(
    !hasAuth,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated roster E2E.",
  );

  test("agents, skills, MCP badge, team org chart", async ({ page }) => {
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

    await page.goto("/dashboard/onboarding");
    await expect(page.getByTestId("onboarding-path-existing")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId("onboarding-path-existing").click();
    await expect(page.getByTestId("onboarding-business-name")).toBeVisible();

    const bizName = `E2E Roster ${Date.now()}`;
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

    async function createAgentViaForm(name: string, role: string) {
      await page.goto(`/dashboard/agents/new?businessId=${businessId}`);
      await page.getByTestId("agent-name").fill(name);
      await page.getByTestId("agent-role").fill(role);
      const editor = page.getByTestId("agent-instructions-editor");
      await expect(editor).toBeVisible({ timeout: 60_000 });
      await fillMarkdownEditor(editor, `${name} instructions`);
      await page.getByRole("button", { name: /^Continue$/i }).click();
      await page.getByRole("button", { name: /^Continue$/i }).click();
      await page.getByTestId("agent-save").click();
      // App Router client transition: default waitUntil `load` may never fire after RSC POST 200.
      await page.waitForURL(/\/dashboard\/agents\/[0-9a-f-]+/i, {
        timeout: 120_000,
        waitUntil: "domcontentloaded",
      });
    }

    await createAgentViaForm("E2E Lead", "Lead");
    await page.getByRole("tab", { name: "Instructions" }).click();
    // Wizard persists onboarding instructions to soul.md; default selected tab is agent.md.
    await page
      .getByRole("navigation", { name: "Documents" })
      .getByRole("button", { name: /^soul\.md$/ })
      .click();
    await expect(page.getByTestId("agent-doc-editor-soul")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId("agent-doc-editor-soul").fill(
      "Updated lead instructions for E2E.",
    );
    await page.getByTestId("agent-doc-save-soul").click();
    await expect(page.getByTestId("agent-doc-editor").getByText("Saved")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("tab", { name: "Skills" }).click();
    await expect(page.getByTestId("skill-create-toggle")).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("skill-create-toggle").click();
    await page.getByTestId("skill-new-name").fill("E2E Skill");
    await page.getByTestId("skill-create-submit").click();
    await expect(page.locator('[data-testid^="skill-attached-"]').first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("tab", { name: "MCP" }).click();
    await expect(page.getByTestId("mcp-installer")).toBeVisible();
    await page.getByTestId("mcp-configure-github").click();
    await expect(page.getByTestId("mcp-field-token")).toBeVisible();
    await page.getByTestId("mcp-field-token").fill("ghp_dummy_token_for_e2e");
    await page.getByTestId("mcp-field-defaultOrg").fill("acme");
    await page.getByTestId("mcp-install-submit").click();
    await expect(page.getByTestId("mcp-integration-github")).toContainText("Active", {
      timeout: 30_000,
    });

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
    await page.getByTestId("team-lead").getByRole("button").click();
    await page.getByRole("option", { name: "E2E Lead" }).click();
    const memberList = page.getByTestId("team-member-list");
    await memberList.getByRole("button", { name: /Add E2E Member One/i }).click();
    await memberList.getByRole("button", { name: /Add E2E Member Two/i }).click();
    await page.getByTestId("team-create-submit").click();
    await page.waitForURL(/\/dashboard\/teams\/[0-9a-f-]+/i, {
      timeout: 120_000,
      waitUntil: "domcontentloaded",
    });

    await page.getByRole("button", { name: "Org Chart" }).click();
    await expect(page.getByTestId("org-chart")).toBeVisible();
    const orgChart = page.getByTestId("org-chart");
    await expect(orgChart.locator('[data-testid^="org-node-"]').first()).toBeVisible();
    for (const name of ["E2E Lead", "E2E Member One", "E2E Member Two"] as const) {
      await expect(orgChart.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(page.getByTestId("team-lead-label")).toContainText("E2E Lead");
  });
});
