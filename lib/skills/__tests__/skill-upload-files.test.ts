import { describe, expect, it } from "vitest";
import JSZip from "jszip";

import {
  collectSkillFilesFromFileList,
  collectSkillFilesFromZip,
} from "@/lib/skills/skill-upload-files";

describe("skill-upload-files", () => {
  it("collectSkillFilesFromZip reads markdown paths", async () => {
    const zip = new JSZip();
    zip.file("SKILL.md", "# Hello");
    zip.file("reference/note.md", "body");
    const raw = await zip.generateAsync({ type: "uint8array" });
    const file = new File([new Uint8Array(raw)], "skill.zip", {
      type: "application/zip",
    });
    const got = await collectSkillFilesFromZip(file);
    const paths = new Set(got.map((g) => g.path));
    expect(paths.has("SKILL.md")).toBe(true);
    expect(paths.has("reference/note.md")).toBe(true);
  });

  it("collectSkillFilesFromFileList uses webkitRelativePath when present", async () => {
    const a = new File(["x"], "SKILL.md", { type: "text/plain" });
    Object.defineProperty(a, "webkitRelativePath", {
      value: "my-skill/SKILL.md",
      configurable: true,
    });
    const list = [a] as unknown as FileList;
    const got = await collectSkillFilesFromFileList(list);
    expect(got.some((x) => x.path === "my-skill/SKILL.md")).toBe(true);
  });
});
