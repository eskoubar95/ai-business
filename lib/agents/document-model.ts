export const AGENT_DOC_SLUGS = ["soul", "tools", "heartbeat"] as const;
export type AgentDocSlug = (typeof AGENT_DOC_SLUGS)[number];

export type AgentDocumentRow = {
  slug: string;
  content: string;
  filename: string;
};
