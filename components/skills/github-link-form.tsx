"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { installSkillFromGitHub } from "@/lib/skills/file-actions";

type Props = {
  businessId: string;
  onDone: () => void;
  onCancel: () => void;
};

export function GitHubSkillLinkForm({ businessId, onDone, onCancel }: Props) {
  const [skillName, setSkillName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const nm = skillName.trim();
        const url = githubUrl.trim();
        if (!nm) {
          setError("Skill name is required.");
          return;
        }
        if (!url) {
          setError("GitHub URL is required.");
          return;
        }
        await installSkillFromGitHub(businessId, nm, url);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Install failed");
      }
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Skill name
        <input
          data-testid="skill-github-name"
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          placeholder="cursor-rule-pack"
          disabled={pending}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        GitHub URL (repo tree or folder)
        <input
          data-testid="skill-github-url"
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/org/repo/tree/main/skills/my-skill"
          disabled={pending}
          required
        />
      </label>
      <p className="text-muted-foreground text-xs">
        Only <span className="font-mono">github.com</span> URLs are supported. Allowed files:{" "}
        <span className="font-mono">.md</span>, <span className="font-mono">.js</span>,{" "}
        <span className="font-mono">.mjs</span> (recursive depth 2). Server uses{" "}
        <span className="font-mono">GITHUB_TOKEN</span> when set for rate limits.
      </p>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending} data-testid="skill-github-submit">
          {pending ? "Fetching…" : "Install from GitHub"}
        </Button>
      </div>
    </form>
  );
}
