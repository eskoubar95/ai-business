"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, ExternalLink, Plus, X } from "lucide-react";

import {
  attachSkillToAgent,
  createSkill,
  detachSkillFromAgent,
} from "@/lib/skills/actions";
import type { skills } from "@/db/schema";
import { cn } from "@/lib/utils";

type Skill = typeof skills.$inferSelect;

type Props = {
  agentId: string;
  businessId: string;
  attached: Skill[];
  library: Skill[];
};

function SkillRow({
  skill,
  isAttached,
  onToggle,
  disabled,
  businessId,
}: {
  skill: Skill;
  isAttached: boolean;
  onToggle: () => void;
  disabled: boolean;
  businessId: string;
}) {
  return (
    <div
      className={cn(
        "group grid grid-cols-[20px_1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors",
        "border-b border-white/[0.05] last:border-0",
        "hover:bg-white/[0.04]",
      )}
      data-testid={isAttached ? `skill-attached-${skill.id}` : `skill-available-${skill.id}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isAttached}
        disabled={disabled}
        onClick={onToggle}
        data-testid={isAttached ? `skill-detach-${skill.id}` : `skill-attach-${skill.id}`}
        className={cn(
          "flex size-[14px] shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-all duration-100",
          "disabled:pointer-events-none disabled:opacity-40",
          isAttached
            ? "border-primary bg-primary text-primary-foreground"
            : "border-white/[0.20] bg-transparent hover:border-white/[0.35]",
        )}
      >
        {isAttached && <Check className="size-2.5 stroke-[3]" />}
      </button>

      {/* Name */}
      <span className={cn("text-[13px] tracking-[-0.01em]", isAttached ? "text-foreground" : "text-muted-foreground")}>
        {skill.name}
      </span>

      {/* View link */}
      <Link
        href={`/dashboard/skills/${skill.id}?businessId=${encodeURIComponent(businessId)}`}
        className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        View
        <ExternalLink className="size-2.5" />
      </Link>
    </div>
  );
}

export function SkillManager({ agentId, businessId, attached, library }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Optimistic attach state
  const [localAttached, setLocalAttached] = useState(() => new Set(attached.map((s) => s.id)));

  // New skill inline form
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const newNameRef = useRef<HTMLInputElement>(null);

  /** Skills created in-session until RSC refresh merges them into `library`. */
  const [pendingLibrarySkills, setPendingLibrarySkills] = useState<Skill[]>([]);

  useEffect(() => {
    setPendingLibrarySkills((prev) =>
      prev.filter((s) => !library.some((row) => row.id === s.id)),
    );
  }, [library]);

  const mergedLibrary = useMemo(() => {
    const byId = new Map<string, Skill>();
    for (const s of library) byId.set(s.id, s);
    for (const s of pendingLibrarySkills) byId.set(s.id, s);
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [library, pendingLibrarySkills]);

  const attachedSkills = mergedLibrary.filter((s) => localAttached.has(s.id));
  const availableSkills = mergedLibrary.filter((s) => !localAttached.has(s.id));

  function toggle(skill: Skill) {
    const isAttached = localAttached.has(skill.id);
    // Optimistic update
    setLocalAttached((prev) => {
      const next = new Set(prev);
      isAttached ? next.delete(skill.id) : next.add(skill.id);
      return next;
    });
    setError(null);
    startTransition(async () => {
      try {
        if (isAttached) {
          await detachSkillFromAgent(agentId, skill.id);
        } else {
          await attachSkillToAgent(agentId, skill.id);
        }
        router.refresh();
      } catch (e) {
        // Revert optimistic update
        setLocalAttached((prev) => {
          const next = new Set(prev);
          isAttached ? next.add(skill.id) : next.delete(skill.id);
          return next;
        });
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  function startCreate() {
    setCreating(true);
    setNewName("");
    setTimeout(() => newNameRef.current?.focus(), 50);
  }

  function createAndAttach() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      try {
        const skill = await createSkill({ businessId, name, markdown: "" });
        await attachSkillToAgent(agentId, skill.id);
        setLocalAttached((prev) => new Set(prev).add(skill.id));
        setPendingLibrarySkills((prev) =>
          prev.some((s) => s.id === skill.id) ? prev : [...prev, skill],
        );
        setCreating(false);
        setNewName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Create failed");
      }
    });
  }

  return (
    <div className="flex flex-col" data-testid="skill-manager">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <p className="section-label">Skills library</p>
        <span className="font-mono text-[11px] text-muted-foreground/50">
          {localAttached.size} attached
        </span>
      </div>

      {/* Skill list */}
      <div className="rounded-md border border-border overflow-hidden">
        {mergedLibrary.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-[13px] text-muted-foreground">No skills in library yet</p>
            <p className="text-[11px] text-muted-foreground/50">
              Create skills in the{" "}
              <Link
                href={`/dashboard/skills?businessId=${encodeURIComponent(businessId)}`}
                className="text-primary hover:opacity-80"
              >
                Skills section
              </Link>
            </p>
          </div>
        ) : (
          <>
            {/* Attached group */}
            {attachedSkills.length > 0 && (
              <>
                <div className="border-b border-white/[0.07] bg-white/[0.015] px-4 py-2">
                  <p className="section-label">Attached</p>
                </div>
                {attachedSkills.map((s) => (
                  <SkillRow
                    key={s.id}
                    skill={s}
                    isAttached
                    onToggle={() => toggle(s)}
                    disabled={pending}
                    businessId={businessId}
                  />
                ))}
              </>
            )}

            {/* Available group */}
            {availableSkills.length > 0 && (
              <>
                <div
                  className={cn(
                    "bg-white/[0.015] px-4 py-2",
                    attachedSkills.length > 0
                      ? "border-y border-white/[0.07]"
                      : "border-b border-white/[0.07]",
                  )}
                >
                  <p className="section-label">Available</p>
                </div>
                {availableSkills.map((s) => (
                  <SkillRow
                    key={s.id}
                    skill={s}
                    isAttached={false}
                    onToggle={() => toggle(s)}
                    disabled={pending}
                    businessId={businessId}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-[12px] text-destructive" role="alert">{error}</p>
      )}

      {/* Footer: create new skill */}
      <div className="mt-3">
        {!creating ? (
          <button
            type="button"
            data-testid="skill-create-toggle"
            onClick={startCreate}
            className="flex cursor-pointer items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-3" />
            New skill
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-white/[0.10] bg-white/[0.02] px-3 py-2">
            <Plus className="size-3 shrink-0 text-muted-foreground/40" />
            <input
              ref={newNameRef}
              data-testid="skill-new-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createAndAttach();
                if (e.key === "Escape") { setCreating(false); setNewName(""); }
              }}
              placeholder="Skill name…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/30"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                data-testid="skill-create-submit"
                disabled={pending || !newName.trim()}
                onClick={createAndAttach}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  "bg-primary/10 text-primary hover:bg-primary/15",
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                <Check className="size-3" />
                Create
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setNewName(""); }}
                className="cursor-pointer rounded p-1 text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
