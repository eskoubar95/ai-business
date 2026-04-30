import Link from "next/link";

import { cn } from "@/lib/utils";

export type SettingsSectionId =
  | "account"
  | "business"
  | "mcp"
  | "webhooks"
  | "notion";

const ITEMS: { id: SettingsSectionId; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "business", label: "Business" },
  { id: "mcp", label: "MCP Library" },
  { id: "webhooks", label: "Webhooks" },
  { id: "notion", label: "Notion" },
];

export function SettingsSubNav({
  businessId,
  active,
}: {
  businessId: string;
  active: SettingsSectionId;
}) {
  const prefix = `/dashboard/settings?businessId=${encodeURIComponent(businessId)}`;

  return (
    <nav
      aria-label="Settings sections"
      className="border-border flex flex-col gap-1 border-b pb-4 lg:border-b-0 lg:pb-0"
    >
      {ITEMS.map((item) => {
        const href = `${prefix}&section=${item.id}`;
        const isActive = active === item.id;
        return (
          <Link
            key={item.id}
            href={href}
            data-testid={`settings-nav-${item.id}`}
            className={cn(
              "hover:bg-accent rounded-md px-3 py-2 text-sm transition-colors duration-150",
              isActive && "bg-accent text-primary font-medium",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
