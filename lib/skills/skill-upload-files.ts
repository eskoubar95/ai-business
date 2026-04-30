import JSZip from "jszip";

export type SkillFilePayload = { path: string; content: string };

function normalizeZipEntryPath(relPath: string): string | null {
  const forward = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!forward || forward.split("/").some((s) => s === "..")) return null;
  return forward;
}

/** Extract text files from a browser `File` that is a ZIP archive. */
export async function collectSkillFilesFromZip(file: File): Promise<SkillFilePayload[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const out: SkillFilePayload[] = [];
  const tasks: Promise<void>[] = [];

  zip.forEach((relPath, entry) => {
    if (entry.dir) return;
    const norm = normalizeZipEntryPath(relPath);
    if (!norm) return;
    tasks.push(
      (async () => {
        try {
          const content = await entry.async("string");
          out.push({ path: norm, content });
        } catch {
          // Skip binary / unreadable entries
        }
      })(),
    );
  });

  await Promise.all(tasks);
  return out;
}

function normalizeMultiFilePath(file: File): string | null {
  const rel = file.webkitRelativePath?.trim();
  const raw = rel && rel.length > 0 ? rel.replace(/\\/g, "/") : file.name;
  const forward = raw.replace(/^\/+/, "");
  if (!forward || forward.split("/").some((s) => s === "..")) return null;
  return forward;
}

/** Map selected files (flat or folder via `webkitRelativePath`) to payloads. */
export async function collectSkillFilesFromFileList(files: FileList): Promise<SkillFilePayload[]> {
  const list = Array.from(files);
  const out: SkillFilePayload[] = [];

  await Promise.all(
    list.map(async (file) => {
      const path = normalizeMultiFilePath(file);
      if (!path) return;
      const content = await file.text();
      out.push({ path, content });
    }),
  );

  return out;
}
