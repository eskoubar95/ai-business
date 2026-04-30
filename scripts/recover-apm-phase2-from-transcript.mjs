/**
 * Extract `Write` payloads from Cursor agent transcripts (JSONL) — Phase 2 APM restore.
 * Usage: `node scripts/recover-apm-phase2-from-transcript.mjs`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

const TRANSCRIPT_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".cursor/projects/c-Users-Nicklas-Github-ai-business/agent-transcripts",
);

function readJsonlWrites(file) {
  const out = [];
  if (!fs.existsSync(file)) {
    console.error("missing transcript:", file);
    return out;
  }
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    try {
      const o = JSON.parse(line);
      const blocks = o.role === "assistant" && o.message?.content;
      if (!Array.isArray(blocks)) continue;
      for (const b of blocks) {
        if (b?.type !== "tool_use" || b?.name !== "Write" || !b?.input?.path) continue;
        const raw = String(b.input.path);
        const parts = raw.split(/[/\\]/i);
        const idx = parts.lastIndexOf("ai-business");
        const tail = idx >= 0 ? parts.slice(idx + 1).join("/") : raw.replaceAll("\\", "/");
        if (tail.startsWith(".apm")) out.push({ rel: tail, contents: String(b.input.contents ?? "") });
      }
    } catch {
      /* skip */
    }
  }
  return out;
}

function main() {
  const planner = path.join(
    TRANSCRIPT_DIR,
    "e1f7b3ca-22f1-4a70-902c-7948becaa2d1",
    "e1f7b3ca-22f1-4a70-902c-7948becaa2d1.jsonl",
  );
  const manager = path.join(
    TRANSCRIPT_DIR,
    "23e07294-1cab-47de-ac35-c1cc3482f476",
    "23e07294-1cab-47de-ac35-c1cc3482f476.jsonl",
  );

  const planners = ["spec.md", "plan.md", "memory/index.md", "bus/backend-agent/task.md", "bus/frontend-agent/task.md"];

  /** Last Write wins inside planner transcript */
  const byRel = new Map();
  for (const { rel, contents } of readJsonlWrites(planner)) {
    const sub = rel.replace(/^\.apm\//, "");
    if (planners.includes(sub)) byRel.set(sub, contents);
  }

  if (!byRel.get("plan.md")) {
    console.error("No plan.md recovered — check TRANSCRIPT_DIR:", TRANSCRIPT_DIR);
    process.exit(1);
  }

  for (const [sub, contents] of byRel) {
    const dest = path.join(REPO, ".apm", sub);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, contents, "utf8");
    console.log("wrote", ".apm/" + sub, "(" + contents.length + " chars)");
  }

  const managerWrites = readJsonlWrites(manager);
  const backendHandoffs = managerWrites.filter((w) => w.rel.endsWith("bus/backend-agent/handoff.md")).map((w) => w.contents);
  const frontendHandoffs = managerWrites.filter((w) => w.rel.endsWith("bus/frontend-agent/handoff.md")).map((w) => w.contents);

  const bh = backendHandoffs.find((c) =>
    /task:\s*"1\.1|Task \*\*1\.1\*\*|1\.1 — Schema/i.test(c),
  );
  const fh = frontendHandoffs.find((c) =>
    /task:\s*"1\.2|Task \*\*1\.2\*\*|1\.2 — P0 UX/i.test(c),
  );

  const archRoot = path.join(REPO, ".apm/memory/handoffs/worker-recovered");
  fs.mkdirSync(archRoot, { recursive: true });
  if (bh) {
    fs.writeFileSync(path.join(archRoot, "backend-agent-task-1.1-handoff.md"), bh, "utf8");
    console.log("wrote .apm/memory/handoffs/worker-recovered/backend-agent-task-1.1-handoff.md");
  } else {
    console.warn("Could not isolate Task 1.1 backend handoff from transcript.");
  }
  if (fh) {
    fs.writeFileSync(path.join(archRoot, "frontend-agent-task-1.2-handoff.md"), fh, "utf8");
    console.log("wrote .apm/memory/handoffs/worker-recovered/frontend-agent-task-1.2-handoff.md");
  } else {
    console.warn("Could not isolate Task 1.2 frontend handoff from transcript.");
  }

  console.log("(`.apm/tracker.md` untouched — keeps merge progress on main.)");
}

main();
