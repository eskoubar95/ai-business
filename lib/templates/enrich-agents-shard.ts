import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TemplateSeedError } from "@/lib/templates/template-errors";
import type { EnterpriseAgentShardEntry } from "@/lib/templates/zod-schemas";

const INSTRUCTION_FILES = [
  { slug: "agents" as const, filename: "AGENTS.md", file: "AGENTS.md" },
  { slug: "soul" as const, filename: "SOUL.md", file: "SOUL.md" },
  { slug: "heartbeat" as const, filename: "HEARTBEAT.md", file: "HEARTBEAT.md" },
  { slug: "tools" as const, filename: "TOOLS.md", file: "TOOLS.md" },
];

/**
 * Load AGENTS/SOUL/HEARTBEAT/TOOLS markdown for each enterprise agent shard row.
 * `instructions_path` is relative to the enterprise v3 template root (`templates/conduro/enterprise/v3`).
 */
export function enrichAgentsShardWithInstructionBodies(
  templateRootV3: string,
  agents: EnterpriseAgentShardEntry[],
): EnterpriseAgentShardEntry[] {
  return agents.map((agent) => {
    const base = agent.instructions_path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    const agent_documents = INSTRUCTION_FILES.map(({ slug, filename, file }) => {
      const abs = join(templateRootV3, base, file);
      try {
        const content = readFileSync(abs, "utf8");
        return { slug, filename, content };
      } catch {
        throw new TemplateSeedError(
          "INSTRUCTION_FILES_MISSING",
          `Missing instruction file for ${agent.agent_slug}: ${filename} (expected at ${abs})`,
        );
      }
    });

    return { ...agent, agent_documents };
  });
}
