"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FileTree } from "@/components/ui/file-tree";
import { NovelEditor } from "@/components/ui/novel-editor";
import { RightPanel } from "@/components/ui/right-panel";
import type { SkillOverviewRow } from "@/lib/skills/actions";
import {
  attachSkillToAgent,
  deleteSkill,
  detachSkillFromAgent,
  listSkillFilesForSkill,
} from "@/lib/skills/actions";
import { pathsToFileTreeNodes } from "@/lib/skills/paths-to-file-tree";
import { plainTextToProseDoc } from "@/lib/skills/plain-text-to-prose-doc";

import { GitHubSkillLinkForm } from "./github-link-form";
import { UploadSkillForm } from "./upload-form";

type Props = {
  businessId: string;
  skills: SkillOverviewRow[];
  agents: { id: string; name: string }[];
};

export function SkillsDashboard({ businessId, skills, agents }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "upload" | "github">(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [panelSkill, setPanelSkill] = useState<{ id: string; name: string } | null>(null);
  const [files, setFiles] = useState<{ path: string; content: string }[] | null>(null);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  function closeModal() {
    setModal(null);
    setError(null);
  }

  function afterInstall() {
    toast.success("Skill installed.");
    closeModal();
    router.refresh();
  }

  function toggleAgent(skillId: string, agentId: string, next: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        if (next) await attachSkillToAgent(agentId, skillId);
        else await detachSkillFromAgent(agentId, skillId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  function removeSkill(skillId: string, name: string) {
    if (!window.confirm(`Delete skill “${name}” and all its files?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteSkill(skillId);
        toast.success("Skill deleted.");
        if (panelSkill?.id === skillId) setPanelSkill(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  useEffect(() => {
    if (!panelSkill) {
      setFiles(null);
      setSelectedPath(null);
      return;
    }
    let cancelled = false;
    setFilesLoading(true);
    listSkillFilesForSkill(panelSkill.id, businessId)
      .then((f) => {
        if (cancelled) return;
        setFiles(f);
        setSelectedPath(f[0]?.path ?? null);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load skill files.");
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [panelSkill, businessId]);

  const treeNodes = useMemo(
    () => (files ? pathsToFileTreeNodes(files.map((x) => x.path)) : []),
    [files],
  );

  const selectedContent = useMemo(() => {
    if (!files || !selectedPath) return "";
    return files.find((f) => f.path === selectedPath)?.content ?? "";
  }, [files, selectedPath]);

  const openSkillPanel = useCallback((s: SkillOverviewRow) => {
    setPanelSkill({ id: s.id, name: s.name });
  }, []);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="cursor-pointer"
          data-testid="skills-open-upload"
          onClick={() => setModal("upload")}
        >
          Upload files / ZIP
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="cursor-pointer"
          data-testid="skills-open-github"
          onClick={() => setModal("github")}
        >
          Install from GitHub
        </Button>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border" data-testid="skills-table-wrap">
        {skills.length === 0 ? (
          <p className="text-muted-foreground p-6 text-sm">
            No skills yet. Upload a folder or ZIP that includes{" "}
            <span className="font-mono">SKILL.md</span>, or install from GitHub.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Skill</th>
                <th className="px-3 py-2">Files</th>
                <th className="px-3 py-2">Agents</th>
                <th className="w-[120px] px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.id} className="border-b" data-testid={`skill-row-${s.id}`}>
                  <td className="px-0 py-0">
                    <button
                      type="button"
                      className="hover:bg-accent/50 w-full cursor-pointer px-3 py-2 text-left font-medium transition-colors"
                      data-testid={`skill-row-open-${s.id}`}
                      onClick={() => openSkillPanel(s)}
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="text-muted-foreground px-3 py-2">{s.fileCount}</td>
                  <td className="px-3 py-2">
                    {agents.length === 0 ? (
                      <span className="text-muted-foreground text-xs">
                        No agents —{" "}
                        <Link
                          href={`/dashboard/agents/new?businessId=${encodeURIComponent(businessId)}`}
                          className="text-primary underline"
                        >
                          create one
                        </Link>
                      </span>
                    ) : (
                      <div
                        className="flex flex-wrap gap-x-3 gap-y-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {agents.map((a) => {
                          const checked = s.agents.some((x) => x.id === a.id);
                          return (
                            <label
                              key={a.id}
                              className="flex cursor-pointer items-center gap-1.5 text-xs"
                            >
                              <input
                                type="checkbox"
                                className="accent-primary"
                                checked={checked}
                                disabled={pending}
                                onChange={(e) => toggleAgent(s.id, a.id, e.target.checked)}
                                data-testid={`skill-agent-${s.id}-${a.id}`}
                              />
                              <span>{a.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-destructive hover:underline disabled:opacity-50 cursor-pointer text-xs disabled:cursor-not-allowed"
                      disabled={pending}
                      data-testid={`skill-delete-${s.id}`}
                      onClick={() => removeSkill(s.id, s.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RightPanel
        open={Boolean(panelSkill)}
        onOpenChange={(o) => {
          if (!o) setPanelSkill(null);
        }}
        title={panelSkill?.name ?? "Skill"}
      >
        {filesLoading ? (
          <p className="text-muted-foreground text-sm">Loading files…</p>
        ) : files && files.length ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="border-border w-full shrink-0 rounded-md border p-2 lg:w-[25%]">
              <FileTree
                nodes={treeNodes}
                selectedId={selectedPath}
                onSelect={(id) => setSelectedPath(id)}
                className="max-h-[480px]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <NovelEditor
                key={selectedPath ?? "none"}
                className="w-full"
                initialContent={plainTextToProseDoc(selectedContent)}
              />
            </div>
          </div>
        ) : panelSkill ? (
          <p className="text-muted-foreground text-sm">No files in this skill.</p>
        ) : null}
      </RightPanel>

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          data-testid={`skills-modal-${modal}`}
        >
          <div className="bg-background border-border max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {modal === "upload" ? "Upload skill" : "Install from GitHub"}
            </h2>
            {modal === "upload" ? (
              <UploadSkillForm businessId={businessId} onDone={afterInstall} onCancel={closeModal} />
            ) : (
              <GitHubSkillLinkForm
                businessId={businessId}
                onDone={afterInstall}
                onCancel={closeModal}
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
