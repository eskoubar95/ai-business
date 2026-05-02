/** Field metadata for MCP credential UI (matches JSON keys encrypted by `saveMcpCredential(businessId, …)`). */
export type McpFieldDef =
  | { name: string; label: string; type: "string" }
  | { name: string; label: string; type: "password" }
  | { name: string; label: string; type: "url" };

export type McpTypeConfig = {
  id: "github" | "notion" | "context7";
  label: string;
  description: string;
  fields: McpFieldDef[];
};

export const MCP_TYPE_CONFIGS: readonly McpTypeConfig[] = [
  {
    id: "github",
    label: "GitHub",
    description: "Code access, issues, PRs, and repository management",
    fields: [
      { name: "token", label: "Personal access token", type: "password" },
      { name: "defaultOrg", label: "Default org or owner", type: "string" },
    ],
  },
  {
    id: "notion",
    label: "Notion",
    description: "Workspace pages, databases, and backlog access",
    fields: [
      { name: "token", label: "Integration token", type: "password" },
      { name: "workspaceId", label: "Workspace ID", type: "string" },
      { name: "tasksDatabaseId", label: "Tasks data source ID", type: "string" },
    ],
  },
  {
    id: "context7",
    label: "Context7",
    description: "Real-time library documentation for any package or SDK",
    fields: [
      { name: "apiKey", label: "API key", type: "password" },
      { name: "baseUrl", label: "Base URL", type: "url" },
    ],
  },
];

export function listMcpTypeConfigs(): readonly McpTypeConfig[] {
  return MCP_TYPE_CONFIGS;
}
