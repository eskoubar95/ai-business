import { redirect } from "next/navigation";

import type { SettingsSectionId } from "@/components/settings/settings-subnav";
import { SettingsSubNav } from "@/components/settings/settings-subnav";
import { BusinessSelector } from "@/components/business-selector";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { auth } from "@/lib/auth/server";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { getSettingsPageState } from "@/lib/settings/actions";

import { NotionSettingsSection } from "./notion-settings-section";
import { SettingsAccountSection } from "./settings-account-section";
import { SettingsBusinessSection } from "./settings-business-section";
import { SettingsMcpSection } from "./settings-mcp-section";
import { SettingsWebhooksSection } from "./settings-webhooks-section";

export const dynamic = "force-dynamic";

function parseSection(raw: string | undefined): SettingsSectionId {
  if (
    raw === "account" ||
    raw === "business" ||
    raw === "mcp" ||
    raw === "webhooks" ||
    raw === "notion"
  ) {
    return raw;
  }
  return "account";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string; section?: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");

  const { hasCursorApiKey, businesses } = await getSettingsPageState();
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/settings");
  const section = parseSection(sp.section);

  if (businesses.length === 0) {
    return (
      <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
        <PageHeader
          breadcrumb={
            <div>
              <h1 className="text-foreground text-lg font-semibold">Settings</h1>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Account credentials and per-business workspace defaults.
              </p>
            </div>
          }
          className="px-0 pt-0"
        />
        <p className="text-muted-foreground mt-6 text-sm">
          Create a business from “New business” before configuring workspace paths.
        </p>
      </PageWrapper>
    );
  }

  const businessRow = businesses.find((b) => b.id === businessId)!;
  const selectorBusinesses = businesses.map((b) => ({ id: b.id, name: b.name }));

  const sectionIntro =
    section === "account"
      ? "User-level credentials and encrypted keys."
      : section === "business"
        ? "Paths and metadata for the selected business."
        : section === "mcp"
          ? "Model Context Protocol integrations for agents."
          : section === "webhooks"
            ? "Inbound webhooks and delivery audit log."
            : "Notion MCP connection and task sync history.";

  return (
    <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
      <PageHeader
        breadcrumb={
          <div>
            <h1 className="text-foreground text-lg font-semibold">Settings</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">{sectionIntro}</p>
          </div>
        }
        className="px-0 pt-0"
      />

      <BusinessSelector businesses={selectorBusinesses} currentBusinessId={businessId} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <SettingsSubNav businessId={businessId} active={section} />
        <div className="min-w-0">
          {section === "account" ? <SettingsAccountSection hasCursorApiKey={hasCursorApiKey} /> : null}
          {section === "business" ? (
            <SettingsBusinessSection businessId={businessId} business={businessRow} />
          ) : null}
          {section === "mcp" ? <SettingsMcpSection businessId={businessId} /> : null}
          {section === "webhooks" ? <SettingsWebhooksSection businessId={businessId} /> : null}
          {section === "notion" ? <NotionSettingsSection businessId={businessId} /> : null}
        </div>
      </div>
    </PageWrapper>
  );
}
