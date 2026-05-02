"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  GitFork,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SkillOverviewRow } from "@/lib/skills/actions";
import {
  attachSkillToAgent,
  deleteSkill,
  detachSkillFromAgent,
  listSkillFilesForSkill,
} from "@/lib/skills/actions";
import { installSkillFromGitHub } from "@/lib/skills/file-actions";
import { pathsToFileTreeNodes } from "@/lib/skills/paths-to-file-tree";

import { UploadSkillForm } from "./upload-form";
import { MetaField, SkillFileTreeRow } from "./skills-dashboard-file-tree";

type Props = {
  businessId: string;
  skills: SkillOverviewRow[];
  agents: { id: string; name: string }[];
};

type FileViewMode = "view" | "code";

export function SkillsDashboard({ businessId, skills, agents }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileViewMode, setFileViewMode] = useState<FileViewMode>("view");
  const [filterQuery, setFilterQuery] = useState("");

  const [installUrl, setInstallUrl] = useState("");
  const [installName, setInstallName] = useState("");
  const [showInstallExpanded, setShowInstallExpanded] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installPending, startInstallTransition] = useTransition();

  const [files, setFiles] = useState<{ path: string; content: string }[] | null>(null);
  const [filesLoading, setFilesLoading] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const selectedSkill = useMemo(
    () => skills.find((s) => s.id === selectedSkillId) ?? null,
    [skills, selectedSkillId],
  );

  const filteredSkills = useMemo(() => {
    if (!filterQuery.trim()) return skills;
    const q = filterQuery.toLowerCase();
    return skills.filter((s) => s.name.toLowerCase().includes(q));
  }, [skills, filterQuery]);

  const treeNodes = useMemo(
    () => (files ? pathsToFileTreeNodes(files.map((x) => x.path)) : []),
    [files],
  );

  const selectedContent = useMemo(() => {
    if (!files || !selectedFilePath) return "";
    return files.find((f) => f.path === selectedFilePath)?.content ?? "";
  }, [files, selectedFilePath]);

  useEffect(() => {
    if (!selectedSkillId) {
      setFiles(null);
      setSelectedFilePath(null);
      return;
    }
    let cancelled = false;
    setFilesLoading(true);
    listSkillFilesForSkill(selectedSkillId, businessId)
      .then((f) => {
        if (cancelled) return;
        setFiles(f);
        const skillMd = f.find((x) => x.path === "SKILL.md");
        setSelectedFilePath(skillMd?.path ?? f[0]?.path ?? null);
        setExpandedFolders(new Set());
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
  }, [selectedSkillId, businessId]);

  function selectSkill(skillId: string) {
    setSelectedSkillId(skillId);
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      next.add(skillId);
      return next;
    });
    setFileViewMode("view");
  }

  function toggleSkillExpanded(skillId: string) {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  }

  function toggleFolder(folderId: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  function toggleAgent(skillId: string, agentId: string, next: boolean) {
    startTransition(async () => {
      try {
        if (next) await attachSkillToAgent(agentId, skillId);
        else await detachSkillFromAgent(agentId, skillId);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  function removeSkill(skillId: string, name: string) {
    if (!window.confirm(`Delete skill "${name}" and all its files?`)) return;
    startTransition(async () => {
      try {
        await deleteSkill(skillId);
        toast.success("Skill deleted.");
        if (selectedSkillId === skillId) {
          setSelectedSkillId(null);
          setFiles(null);
          setSelectedFilePath(null);
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  function handleInstallAdd() {
    const url = installUrl.trim();
    const nm = installName.trim();

    if (!url) {
      setInstallError("Paste a GitHub URL first.");
      return;
    }
    if (!url.includes("github.com")) {
      setInstallError("Only github.com URLs are supported.");
      return;
    }
    if (!nm) {
      if (!showInstallExpanded) {
        const derived = url
          .replace(/\/$/, "")
          .split("/")
          .filter(Boolean)
          .pop() ?? "skill";
        setInstallName(derived);
      }
      setShowInstallExpanded(true);
      setInstallError("Enter a name for this skill.");
      return;
    }

    setInstallError(null);
    startInstallTransition(async () => {
      try {
        await installSkillFromGitHub(businessId, nm, url);
        toast.success(`Skill "${nm}" installed.`);
        setInstallUrl("");
        setInstallName("");
        setShowInstallExpanded(false);
        router.refresh();
      } catch (err) {
        setInstallError(err instanceof Error ? err.message : "Install failed");
      }
    });
  }

  const isSelectedFile = useCallback(
    (path: string) => selectedFilePath === path,
    [selectedFilePath],
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="flex w-[240px] shrink-0 flex-col border-r border-border bg-background">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4">
          <div>
            <p className="text-[13px] font-medium text-foreground/90">Skills</p>
            <p className="font-mono text-[10px] text-muted-foreground/40">
              {skills.length} available
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              data-testid="skills-open-upload"
              title="Upload skill"
              className="rounded p-1.5 text-muted-foreground/40 hover:bg-white/[0.06] hover:text-foreground/70 transition-colors"
            >
              <Upload className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              title="Refresh"
              className="rounded p-1.5 text-muted-foreground/40 hover:bg-white/[0.06] hover:text-foreground/70 transition-colors"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/30" />
            <input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter skills"
              className="h-8 w-full rounded-md border border-border bg-white/[0.04] pl-7 pr-2.5 text-[12px] text-foreground/80 placeholder:text-muted-foreground/30 outline-none focus:border-white/[0.14] transition-colors"
            />
          </div>
        </div>

        {/* Install input */}
        <div className="px-3 pb-2 pt-2">
          <div className="flex gap-1.5">
            <input
              value={installUrl}
              onChange={(e) => {
                setInstallUrl(e.target.value);
                setInstallError(null);
                if (e.target.value.trim() && e.target.value.includes("github.com")) {
                  const derived = e.target.value
                    .replace(/\/$/, "")
                    .split("/")
                    .filter(Boolean)
                    .pop() ?? "";
                  if (!installName) setInstallName(derived);
                  setShowInstallExpanded(true);
                } else {
                  setShowInstallExpanded(false);
                }
              }}
              placeholder="Paste GitHub URL…"
              data-testid="skills-open-github"
              className="h-8 min-w-0 flex-1 rounded-md border border-border bg-white/[0.04] px-2.5 text-[12px] text-foreground/80 placeholder:text-muted-foreground/30 outline-none focus:border-white/[0.14] transition-colors"
            />
            <button
              type="button"
              onClick={handleInstallAdd}
              disabled={installPending}
              className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-border bg-white/[0.04] px-2.5 text-[12px] text-foreground/70 hover:bg-white/[0.07] disabled:opacity-50 transition-colors"
            >
              {installPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Plus className="size-3" />
              )}
              Add
            </button>
          </div>

          {showInstallExpanded && (
            <div className="mt-1.5">
              <input
                value={installName}
                onChange={(e) => setInstallName(e.target.value)}
                placeholder="Skill name"
                className="h-8 w-full rounded-md border border-border bg-white/[0.04] px-2.5 text-[12px] text-foreground/80 placeholder:text-muted-foreground/30 outline-none focus:border-white/[0.14] transition-colors"
              />
            </div>
          )}

          {installError && (
            <p className="mt-1 text-[11px] text-destructive/80">{installError}</p>
          )}
        </div>

        {/* Skill list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredSkills.length === 0 ? (
            <p className="px-4 py-6 text-center text-[11px] text-muted-foreground/30">
              {filterQuery ? "No matches" : "No skills yet"}
            </p>
          ) : (
            filteredSkills.map((skill, i) => {
              const isExpanded = expandedSkills.has(skill.id);
              const isActive = selectedSkillId === skill.id;

              return (
                <div
                  key={skill.id}
                  data-testid={`skill-row-${skill.id}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className="animate-fade-in"
                >
                  {/* Skill row */}
                  <div
                    className={cn(
                      "group mx-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-all duration-150",
                      isActive ? "bg-white/[0.06] text-foreground" : "hover:bg-white/[0.04]",
                    )}
                    onClick={() => {
                      selectSkill(skill.id);
                    }}
                    data-testid={`skill-row-open-${skill.id}`}
                  >
                    <GitFork className="size-3.5 shrink-0 text-muted-foreground/40" />
                    <span
                      className={cn(
                        "flex-1 truncate text-[12.5px]",
                        isActive ? "text-foreground" : "text-foreground/70",
                      )}
                    >
                      {skill.name}
                    </span>
                    {treeNodes.length > 0 && isActive ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSkillExpanded(skill.id);
                        }}
                        className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                      >
                        <ChevronRight
                          className={cn(
                            "size-3.5 transition-transform",
                            isExpanded && "rotate-90",
                          )}
                        />
                      </button>
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>

                  {/* File tree for expanded active skill */}
                  {isActive && (
                    <div
                      className={cn(
                        "grid transition-all duration-200 ease-in-out",
                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-1 pb-1">
                          {filesLoading ? (
                            <div className="flex items-center gap-1.5 py-1 pl-8 text-[11px] text-muted-foreground/30">
                              <Loader2 className="size-3 animate-spin" />
                              Loading…
                            </div>
                          ) : (
                            treeNodes.map((node) => (
                              <SkillFileTreeRow
                                key={node.id}
                                node={node}
                                depth={1}
                                expanded={expandedFolders}
                                onToggle={toggleFolder}
                                selectedPath={selectedFilePath}
                                onSelectFile={(path) => {
                                  setSelectedFilePath(path);
                                  setFileViewMode("view");
                                }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-1 flex-col overflow-hidden bg-card">
        {!selectedSkill ? (
          <div className="animate-fade-in flex flex-1 flex-col items-center justify-center gap-3">
            <GitFork className="size-8 text-muted-foreground/15" />
            <p className="text-[13px] text-muted-foreground/30">
              Select a skill to view its files
            </p>
          </div>
        ) : (
          <>
            {/* Detail header (static — does not animate on skill switch) */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
              <div className="flex items-center gap-2.5 min-w-0">
                <GitFork className="size-4 shrink-0 text-muted-foreground/40" />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-foreground/90">
                    {selectedSkill.name}
                  </p>
                  <p className="font-mono text-[9.5px] text-muted-foreground/30">
                    {selectedSkill.fileCount} file{selectedSkill.fileCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={pending}
                data-testid={`skill-delete-${selectedSkill.id}`}
                onClick={() => removeSkill(selectedSkill.id, selectedSkill.name)}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-40"
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            </div>

            {/* Animated panel body — re-mounts on skill switch */}
            <div key={selectedSkillId} className="animate-panel-enter flex flex-col flex-1 overflow-hidden">
              {/* Metadata strip — 2-column grid */}
              <div className="border-b border-white/[0.07] px-6 py-4 shrink-0">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <MetaField label="KEY" value={selectedSkill.name} />
                  <MetaField
                    label="MODE"
                    value={selectedSkill.name.startsWith("http") ? "Read only" : "Editable"}
                  />
                  <MetaField label="FILES" value={String(selectedSkill.fileCount)} />
                  <MetaField
                    label="USED BY"
                    value={
                      selectedSkill.agents.length > 0
                        ? selectedSkill.agents.map((a) => a.name).join(", ")
                        : "No agents attached"
                    }
                  />
                </div>
              </div>

              {/* Agent attach strip */}
              {agents.length > 0 && (
                <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-white/[0.07] px-6 py-2.5">
                  <span className="font-mono text-[9px] tracking-[0.1em] text-muted-foreground/40 uppercase">
                    ATTACH
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {agents.map((a) => {
                      const isAttached = selectedSkill.agents.some((x) => x.id === a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={pending}
                          data-testid={`skill-agent-${selectedSkill.id}-${a.id}`}
                          onClick={() =>
                            toggleAgent(selectedSkill.id, a.id, !isAttached)
                          }
                          className={cn(
                            "flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] transition-colors disabled:opacity-50",
                            isAttached
                              ? "border-primary/30 bg-primary/[0.08] text-primary"
                              : "border-border text-muted-foreground/50 hover:border-white/[0.12] hover:text-foreground/60",
                          )}
                        >
                          {isAttached && <Check className="size-2.5" />}
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* File path bar + view toggle */}
              {selectedFilePath && (
                <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-6 py-2">
                  <span className="font-mono text-[11px] text-muted-foreground/40 truncate">
                    {selectedFilePath}
                  </span>
                  <div className="ml-4 flex shrink-0 items-center gap-0.5 rounded-md border border-border p-0.5">
                    <button
                      type="button"
                      onClick={() => setFileViewMode("view")}
                      className={cn(
                        "rounded px-2.5 py-0.5 text-[11px] transition-colors",
                        fileViewMode === "view"
                          ? "bg-white/[0.07] text-foreground/80"
                          : "text-muted-foreground/40 hover:text-foreground/60",
                      )}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileViewMode("code")}
                      className={cn(
                        "rounded px-2.5 py-0.5 text-[11px] transition-colors",
                        fileViewMode === "code"
                          ? "bg-white/[0.07] text-foreground/80"
                          : "text-muted-foreground/40 hover:text-foreground/60",
                      )}
                    >
                      Code
                    </button>
                  </div>
                </div>
              )}

              {/* File content — re-mounts on file switch */}
              <div key={selectedFilePath} className="animate-panel-enter flex-1 overflow-y-auto">
                {filesLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader2 className="size-5 animate-spin text-muted-foreground/30" />
                    <p className="text-[12px] text-muted-foreground/30">Loading files…</p>
                  </div>
                ) : !selectedFilePath ? (
                  <p className="px-6 py-8 text-[12.5px] text-muted-foreground/30">
                    No files in this skill.
                  </p>
                ) : fileViewMode === "view" && selectedFilePath.endsWith(".md") ? (
                  <div className="prose prose-invert prose-sm max-w-none px-8 py-6 [&_h1]:text-[18px] [&_h2]:text-[15px] [&_h3]:text-[13px] [&_p]:text-[13px] [&_p]:text-foreground/70 [&_li]:text-[13px] [&_li]:text-foreground/70 [&_code]:font-mono [&_code]:text-[11px] [&_code]:text-primary/80 [&_pre]:bg-white/[0.04] [&_pre]:border [&_pre]:border-white/[0.07] [&_pre]:rounded-md [&_pre]:p-4 [&_a]:text-primary">
                    <ReactMarkdown>{selectedContent}</ReactMarkdown>
                  </div>
                ) : fileViewMode === "view" && selectedFilePath.endsWith(".json") ? (
                  <pre className="px-8 py-6 font-mono text-[12px] leading-relaxed text-foreground/70 whitespace-pre-wrap">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedContent), null, 2);
                      } catch {
                        return selectedContent;
                      }
                    })()}
                  </pre>
                ) : (
                  <pre className="px-8 py-6 font-mono text-[12px] leading-relaxed text-foreground/70 whitespace-pre-wrap">
                    {selectedContent}
                  </pre>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Upload modal */}
      {uploadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="skills-modal-upload"
        >
          <div className="relative w-full max-w-lg overflow-auto rounded-lg border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground/90">Upload skill</h2>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="rounded p-1 text-muted-foreground/40 hover:bg-white/[0.06] hover:text-foreground/60 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <UploadSkillForm
              businessId={businessId}
              onDone={() => {
                toast.success("Skill installed.");
                setUploadModalOpen(false);
                router.refresh();
              }}
              onCancel={() => setUploadModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
