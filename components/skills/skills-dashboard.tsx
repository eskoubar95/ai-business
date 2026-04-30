"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { SkillOverviewRow } from "@/lib/skills/actions";
import {
  attachSkillToAgent,
  deleteSkill,
  detachSkillFromAgent,
} from "@/lib/skills/actions";

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
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" data-testid="skills-open-upload" onClick={() => setModal("upload")}>
          Upload files / ZIP
        </Button>
        <Button
          type="button"
          variant="secondary"
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
                <th className="px-3 py-2 w-[120px]" />
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.id} className="border-b" data-testid={`skill-row-${s.id}`}>
                  <td className="px-3 py-2 font-medium">{s.name}</td>
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
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
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
                      className="text-destructive hover:underline disabled:opacity-50 text-xs"
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
