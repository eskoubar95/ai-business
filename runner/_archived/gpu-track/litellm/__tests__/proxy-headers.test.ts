import { createServer } from "node:http";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { buildLiteLLMHeaders, buildLiteLLMMetadata } from "../metadata";

describe("LiteLLM correlation headers (mock proxy)", () => {
  it("forwards x-* headers to a local HTTP server", async () => {
    let captured: Record<string, string | string[] | undefined> = {};
    const server = createServer((req, res) => {
      captured = req.headers;
      res.writeHead(204);
      res.end();
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const addr = server.address();
    if (!addr || typeof addr === "string") {
      throw new Error("expected address");
    }
    const headers = buildLiteLLMHeaders({
      tenantId: "tenant-1",
      businessId: "biz-1",
      agentId: "agent-1",
      jobId: "job-1",
      correlationId: "corr-99",
      templateVersion: "3.0.0",
    });
    await fetch(`http://127.0.0.1:${addr.port}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: "{}",
    });
    expect(captured["x-correlation-id"]).toBe("corr-99");
    expect(captured["x-tenant-id"]).toBe("tenant-1");
    expect(captured["x-job-id"]).toBe("job-1");
    expect(captured["x-template-version"]).toBe("3.0.0");
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it("buildLiteLLMMetadata is an alias of buildLiteLLMHeaders", () => {
    const a = buildLiteLLMHeaders({
      tenantId: "t",
      businessId: "b",
      agentId: "a",
      jobId: "j",
    });
    const b = buildLiteLLMMetadata({
      tenantId: "t",
      businessId: "b",
      agentId: "a",
      jobId: "j",
    });
    expect(b).toEqual(a);
  });
});
