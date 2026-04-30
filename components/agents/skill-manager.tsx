"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  attachSkillToAgent,
  createSkill,
  detachSkillFromAgent,
} from "@/lib/skills/actions";
import type { skills } from "@/db/schema";

import { MarkdownEditorField } from "./markdown-editor-field";

type Props = {
  agentId: string;
  businessId: string;
  attached: (typeof skills.$inferSelect)[];
  library: (typeof skills.$inferSelect)[];
};

export function SkillManager({ agentId, businessId, attached, library }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pickSkillId, setPickSkillId] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMarkdown, setNewMarkdown] = useState("");

  const attachable = useMemo(() => {
    const have = new Set(attached.map((s) => s.id));
    return library.filter((s) => !have.has(s.id));
  }, [attached, library]);

  function attachSelected() {
    if (!pickSkillId) return;
    setError(null);
    startTransition(async () => {
      try {
        await attachSkillToAgent(agentId, pickSkillId);
        setPickSkillId("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Attach failed");
      }
    });
  }

  function detach(skillId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await detachSkillFromAgent(agentId, skillId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Detach failed");
      }
    });
  }

  function createAndAttach() {
    setError(null);
    startTransition(async () => {
      try {
        const skill = await createSkill({
          businessId,
          name: newName,
          markdown: newMarkdown,
        });
        await attachSkillToAgent(agentId, skill.id);
        setNewName("");
        setNewMarkdown("");
        setCreating(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Create failed");
      }
    });
  }

  return (
    <section
      className="border-border mt-8 flex flex-col gap-4 rounded-lg border p-4"
      data-testid="skill-manager"
    >
      <h2 className="text-lg font-semibold">Skills</h2>

      <ul className="flex flex-col gap-2">
        {attached.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
            data-testid={`skill-attached-${s.id}`}
          >
            <span>{s.name}</span>
            <button
              type="button"
              data-testid={`skill-detach-${s.id}`}
              disabled={pending}
              className="text-muted-foreground hover:text-foreground text-xs underline disabled:opacity-50"
              onClick={() => detach(s.id)}
            >
              Remove
            </button>
          </li>
        ))}
        {attached.length === 0 ? (
          <li className="text-muted-foreground text-sm">No skills attached yet.</li>
        ) : null}
      </ul>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" htmlFor="skill-attach-select">
            Attach existing
          </label>
          <select
            id="skill-attach-select"
            data-testid="skill-attach-select"
            className="border-border bg-background rounded-md border px-2 py-1 text-sm"
            value={pickSkillId}
            onChange={(e) => setPickSkillId(e.target.value)}
          >
            <option value="">— Choose skill —</option>
            {attachable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          data-testid="skill-attach-submit"
          disabled={pending || !pickSkillId}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={attachSelected}
        >
          Attach
        </button>
      </div>

      {!creating ? (
        <button
          type="button"
          data-testid="skill-create-toggle"
          className="text-primary w-fit text-sm underline"
          onClick={() => setCreating(true)}
        >
          Create new skill
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-dashed p-3">
          <input
            data-testid="skill-new-name"
            placeholder="Skill name"
            className="border-border bg-background rounded-md border px-3 py-2 text-sm"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <MarkdownEditorField value={newMarkdown} onChange={setNewMarkdown} />
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="skill-create-submit"
              disabled={pending || !newName.trim()}
              className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
              onClick={createAndAttach}
            >
              Create & attach
            </button>
            <button
              type="button"
              className="text-muted-foreground text-sm underline"
              onClick={() => setCreating(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
