"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateAgentDocument } from "@/lib/agents/document-actions";
import type { AgentDocumentRow } from "@/lib/agents/document-model";

type Props = {
  agentId: string;
  initialDocs: AgentDocumentRow[];
};

function contentForSlug(docs: AgentDocumentRow[], slug: string): string {
  return docs.find((d) => d.slug === slug)?.content ?? "";
}

export function DocumentEditor({ agentId, initialDocs }: Props) {
  const [soul, setSoul] = useState(() => contentForSlug(initialDocs, "soul"));
  const [tools, setTools] = useState(() => contentForSlug(initialDocs, "tools"));
  const [heartbeat, setHeartbeat] = useState(() =>
    contentForSlug(initialDocs, "heartbeat"),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(slug: "soul" | "tools" | "heartbeat", body: string) {
    setMessage(null);
    setError(null);
    setPendingSlug(slug);
    startTransition(async () => {
      try {
        await updateAgentDocument(agentId, slug, body);
        setMessage(`${slug} saved.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setPendingSlug(null);
      }
    });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4" data-testid="agent-doc-editor">
      <h2 className="text-lg font-medium">Agent documents</h2>
      {message ? (
        <p className="text-muted-foreground text-sm" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Tabs defaultValue="soul" className="w-full">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="soul" data-testid="agent-doc-tab-soul">
            Soul
          </TabsTrigger>
          <TabsTrigger value="tools" data-testid="agent-doc-tab-tools">
            Tools
          </TabsTrigger>
          <TabsTrigger value="heartbeat" data-testid="agent-doc-tab-heartbeat">
            Heartbeat
          </TabsTrigger>
        </TabsList>
        <TabsContent value="soul" className="mt-4 flex flex-col gap-3">
          <textarea
            data-testid="agent-doc-editor-soul"
            className="border-input bg-background min-h-[200px] w-full rounded-md border px-3 py-2 font-mono text-sm"
            value={soul}
            onChange={(e) => setSoul(e.target.value)}
            disabled={pending && pendingSlug === "soul"}
          />
          <Button
            type="button"
            data-testid="agent-doc-save-soul"
            disabled={pending && pendingSlug === "soul"}
            onClick={() => save("soul", soul)}
          >
            Save Soul
          </Button>
        </TabsContent>
        <TabsContent value="tools" className="mt-4 flex flex-col gap-3">
          <textarea
            data-testid="agent-doc-editor-tools"
            className="border-input bg-background min-h-[200px] w-full rounded-md border px-3 py-2 font-mono text-sm"
            value={tools}
            onChange={(e) => setTools(e.target.value)}
            disabled={pending && pendingSlug === "tools"}
          />
          <Button
            type="button"
            data-testid="agent-doc-save-tools"
            disabled={pending && pendingSlug === "tools"}
            onClick={() => save("tools", tools)}
          >
            Save Tools
          </Button>
        </TabsContent>
        <TabsContent value="heartbeat" className="mt-4 flex flex-col gap-3">
          <textarea
            data-testid="agent-doc-editor-heartbeat"
            className="border-input bg-background min-h-[200px] w-full rounded-md border px-3 py-2 font-mono text-sm"
            value={heartbeat}
            onChange={(e) => setHeartbeat(e.target.value)}
            disabled={pending && pendingSlug === "heartbeat"}
          />
          <Button
            type="button"
            data-testid="agent-doc-save-heartbeat"
            disabled={pending && pendingSlug === "heartbeat"}
            onClick={() => save("heartbeat", heartbeat)}
          >
            Save Heartbeat
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
