"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { installSkillFromFiles } from "@/lib/skills/file-actions";
import {
  collectSkillFilesFromFileList,
  collectSkillFilesFromZip,
} from "@/lib/skills/skill-upload-files";

type Props = {
  businessId: string;
  onDone: () => void;
  onCancel: () => void;
};

export function UploadSkillForm({ businessId, onDone, onCancel }: Props) {
  const [skillName, setSkillName] = useState("");
  const [directoryMode, setDirectoryMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = fileInputRef.current;
    if (!el) return;
    if (directoryMode) {
      el.setAttribute("webkitdirectory", "");
      el.removeAttribute("multiple");
    } else {
      el.removeAttribute("webkitdirectory");
      el.setAttribute("multiple", "");
    }
    el.value = "";
  }, [directoryMode]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = (e.target as HTMLFormElement).elements.namedItem(
      "skill-files",
    ) as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      setError("Choose a .zip archive or one or more files (include SKILL.md).");
      return;
    }

    startTransition(async () => {
      try {
        const nm = skillName.trim();
        if (!nm) {
          setError("Skill name is required.");
          return;
        }

        let payloads;
        const arr = Array.from(files);
        const zipFile = arr.find((f) => f.name.toLowerCase().endsWith(".zip"));
        if (zipFile && arr.length === 1) {
          payloads = await collectSkillFilesFromZip(zipFile);
        } else if (zipFile && arr.length > 1) {
          setError("Upload either one .zip file or multiple loose files — not both.");
          return;
        } else {
          payloads = await collectSkillFilesFromFileList(files);
        }

        if (!payloads.length) {
          setError("No readable files found.");
          return;
        }

        await installSkillFromFiles(businessId, nm, payloads);
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
          data-testid="skill-upload-name"
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          placeholder="my-skill"
          disabled={pending}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Files (.zip or multi-select)
        <input
          ref={fileInputRef}
          data-testid="skill-upload-files"
          name="skill-files"
          type="file"
          multiple={!directoryMode}
          disabled={pending}
          className="text-muted-foreground text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
          onChange={() => setError(null)}
        />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={directoryMode}
          disabled={pending}
          onChange={(e) => {
            setDirectoryMode(e.target.checked);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        Pick a folder (preserves paths under Chromium/WebKit)
      </label>
      <p className="text-muted-foreground text-xs">
        The archive or selection must include <span className="font-mono">SKILL.md</span> at the
        root or in a subfolder.
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
        <Button type="submit" disabled={pending} data-testid="skill-upload-submit">
          {pending ? "Installing…" : "Install"}
        </Button>
      </div>
    </form>
  );
}
