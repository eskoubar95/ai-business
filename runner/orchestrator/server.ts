import { spawn } from "node:child_process";
import path from "node:path";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { getDb } from "@/db/index";
import { agentJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { loadRunnerEnv } from "../bootstrap-env";
import {
  countQueuedJobs,
  enqueueAgentJob,
  fairShareNext,
  markDone,
  markFailed,
  markInflight,
  type AgentJobRow,
} from "@/runner/queue/job-queue";
import { checkQuotaAtDispatch, mergeQuotaWarning } from "@/runner/queue/quota-checker";
import { getOrCreateDefaultRunpodInstance, maybeShutdownTick, recordRunpodActivity } from "@/runner/runpod/state-machine";

loadRunnerEnv();

const spawnBodySchema = z.object({
  business_id: z.string().uuid(),
  agent_slug: z.string().min(1),
  adapter: z.enum(["hermes_agent_cli", "claude_code_cli", "cursor_agent_cli"]),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  correlation_id: z.string().uuid().optional(),
  from_role: z.string().optional(),
  to_role: z.string().optional(),
  tenant_id: z.string().optional(),
  agent_id: z.string().uuid().optional(),
  template_version: z.string().optional(),
});

let workerChain: Promise<void> = Promise.resolve();

function scheduleWorkerLoop(): void {
  workerChain = workerChain
    .then(() => runWorkerLoop())
    .catch((e) => {
      console.error("[orchestrator] worker error:", e instanceof Error ? e.message : e);
    });
}

async function runWorkerLoop(): Promise<void> {
  for (;;) {
    const job = await fairShareNext();
    if (!job) {
      await maybeShutdownTick();
      break;
    }

    await markInflight(job.id);
    try {
      const out = await runAgentJobSubprocess(job);
      await markDone(job.id, out);
    } catch (e) {
      await markFailed(job.id, e instanceof Error ? e.message : String(e));
    }
    await recordRunpodActivity();
    await maybeShutdownTick();
  }
}

function buildAgentEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HOME: process.env.HOME ?? "",
    HERMES_HOME: process.env.HERMES_HOME ?? "",
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? process.env.RUNPOD_ENDPOINT ?? "",
  };
}

function runProcess(cmd: string, args: string[], env: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { env, shell: false });
    let out = "";
    let err = "";
    child.stdout?.on("data", (d) => {
      out += String(d);
    });
    child.stderr?.on("data", (d) => {
      err += String(d);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(out || err);
      } else {
        reject(new Error(err.trim() || `process exited with code ${code}`));
      }
    });
  });
}

async function runAgentJobSubprocess(job: AgentJobRow): Promise<string> {
  const useReal = process.env.ORCHESTRATOR_USE_REAL_CLIS === "1";
  const env = buildAgentEnv();

  if (!useReal) {
    return runProcess(process.execPath, ["-e", "process.stdout.write('mock_ok');"], env);
  }

  switch (job.adapter) {
    case "claude_code_cli":
      return runProcess("claude", ["--version"], env);
    case "hermes_agent_cli":
      return runProcess("hermes", ["--help"], env);
    case "cursor_agent_cli":
      return runProcess("cursor-agent", ["--help"], env);
    default:
      return runProcess(process.execPath, ["-e", "process.stdout.write('noop');"], env);
  }
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw) as unknown;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function handleAgentSpawn(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    json(res, 400, { error: "invalid_json" });
    return;
  }

  const parsed = spawnBodySchema.safeParse(body);
  if (!parsed.success) {
    json(res, 400, { error: "validation_error", detail: parsed.error.flatten() });
    return;
  }
  const b = parsed.data;

  let metadata: Record<string, unknown> | undefined;
  if (b.from_role && b.to_role) {
    const { warning } = await checkQuotaAtDispatch({
      fromRole: b.from_role,
      toRole: b.to_role,
      businessId: b.business_id,
    });
    if (warning) {
      metadata = mergeQuotaWarning({}, warning);
    }
  }

  const row = await enqueueAgentJob({
    businessId: b.business_id,
    agentSlug: b.agent_slug,
    adapter: b.adapter,
    payload: b.payload,
    correlationId: b.correlation_id,
    fromRole: b.from_role,
    toRole: b.to_role,
    metadata,
  });

  scheduleWorkerLoop();

  json(res, 202, { job_id: row.id, status: "queued", correlation_id: row.correlationId });
}

async function handleJobGet(res: ServerResponse, jobId: string): Promise<void> {
  const db = getDb();
  const rows = await db.select().from(agentJobs).where(eq(agentJobs.id, jobId)).limit(1);
  const job = rows[0];
  if (!job) {
    json(res, 404, { error: "job_not_found" });
    return;
  }
  json(res, 200, {
    id: job.id,
    status: job.status,
    output: job.output,
    correlation_id: job.correlationId,
    metadata: job.metadata ?? null,
    enqueued_at: job.enqueuedAt.toISOString(),
    started_at: job.startedAt?.toISOString() ?? null,
    completed_at: job.completedAt?.toISOString() ?? null,
  });
}

async function handleHealth(res: ServerResponse): Promise<void> {
  const depth = await countQueuedJobs();
  const inst = await getOrCreateDefaultRunpodInstance();
  json(res, 200, {
    status: "ok",
    runpod_state: inst.state,
    queue_depth: depth,
  });
}

export function createOrchestratorServer(): Server {
  return createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      try {
        if (req.method === "GET" && url.pathname === "/health") {
          await handleHealth(res);
          return;
        }
        if (req.method === "POST" && url.pathname === "/agent/spawn") {
          await handleAgentSpawn(req, res);
          return;
        }
        const m = url.pathname.match(/^\/agent\/([0-9a-f-]{36})$/i);
        if (req.method === "GET" && m) {
          await handleJobGet(res, m[1]);
          return;
        }
        json(res, 404, { error: "not_found" });
      } catch (e) {
        console.error("[orchestrator]", e);
        json(res, 500, { error: "internal_error" });
      }
    })();
  });
}

export async function listenOrchestrator(port: number): Promise<Server> {
  const server = createOrchestratorServer();
  await new Promise<void>((resolve, reject) => {
    server.listen(port, () => resolve()).on("error", reject);
  });
  return server;
}

const thisFile = fileURLToPath(import.meta.url);
const isMain =
  process.env.npm_lifecycle_event === "orchestrator" ||
  (process.argv[1] !== undefined && path.resolve(process.argv[1]) === path.resolve(thisFile));

if (isMain && !process.env.VITEST) {
  const port = Number(process.env.ORCHESTRATOR_PORT) || 8787;
  void listenOrchestrator(port)
    .then((s) => {
      const addr = s.address();
      const p = typeof addr === "object" && addr && "port" in addr ? addr.port : port;
      console.info(`[orchestrator] listening on :${p}`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
