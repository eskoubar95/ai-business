import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  collectGitHubSkillFiles,
  installSkillFromFiles,
  normalizeSkillFilePath,
  parseGitHubRepoUrl,
} from "../file-actions";

vi.mock("@/lib/roster/session", () => ({
  requireSessionUserId: vi.fn(async () => "user-1"),
}));

vi.mock("@/lib/grill-me/access", () => ({
  assertUserBusinessAccess: vi.fn(async () => {}),
}));

const mockDb = vi.hoisted(() => ({
  insert: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  query: {
    skills: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/db/index", () => ({
  getDb: () => mockDb,
}));

describe("parseGitHubRepoUrl", () => {
  it("parses tree URL with ref and path", () => {
    const r = parseGitHubRepoUrl(
      "https://github.com/acme/cool/tree/main/skills/foo%20bar/baz",
    );
    expect(r.owner).toBe("acme");
    expect(r.repo).toBe("cool");
    expect(r.ref).toBe("main");
    expect(r.pathPrefix).toBe("skills/foo bar/baz");
  });

  it("parses blob URL", () => {
    const r = parseGitHubRepoUrl("https://github.com/acme/cool/blob/v1/README.md");
    expect(r.owner).toBe("acme");
    expect(r.repo).toBe("cool");
    expect(r.ref).toBe("v1");
    expect(r.pathPrefix).toBe("README.md");
  });

  it("parses repo root", () => {
    const r = parseGitHubRepoUrl("https://github.com/acme/cool");
    expect(r.owner).toBe("acme");
    expect(r.repo).toBe("cool");
    expect(r.ref).toBeUndefined();
    expect(r.pathPrefix).toBe("");
  });
});

describe("normalizeSkillFilePath", () => {
  it("rejects path traversal", () => {
    expect(() => normalizeSkillFilePath("../secret")).toThrow("Invalid skill file path");
  });
});

describe("collectGitHubSkillFiles", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns markdown files from directory listing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : String(input);
        if (/\/repos\/o\/r\/contents(\?|$)/.test(url)) {
          return new Response(
            JSON.stringify([
              { type: "file", path: "SKILL.md", sha: "1" },
              { type: "file", path: "reference/adapt.md", sha: "2" },
            ]),
            { status: 200 },
          );
        }
        if (url.includes("SKILL.md")) {
          return new Response(
            JSON.stringify({
              type: "file",
              path: "SKILL.md",
              encoding: "base64",
              content: Buffer.from("# x", "utf8").toString("base64"),
            }),
            { status: 200 },
          );
        }
        if (url.includes("adapt.md")) {
          return new Response(
            JSON.stringify({
              type: "file",
              path: "reference/adapt.md",
              encoding: "base64",
              content: Buffer.from("adapt", "utf8").toString("base64"),
            }),
            { status: 200 },
          );
        }
        return new Response("not found", { status: 404 });
      }),
    );

    const files = await collectGitHubSkillFiles("o", "r", undefined, "", 2);
    expect(files.map((f) => f.path).sort()).toEqual(["SKILL.md", "reference/adapt.md"]);
  });
});

describe("installSkillFromFiles (mocked db)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let insertCount = 0;
    mockDb.insert.mockImplementation(() => ({
      values: () => {
        insertCount += 1;
        if (insertCount === 1) {
          return {
            returning: vi.fn(async () => [{ id: "skill-1" }]),
          };
        }
        return {
          onConflictDoUpdate: () => Promise.resolve(undefined),
        };
      },
    }));
  });

  it("rejects bundle without SKILL.md", async () => {
    await expect(
      installSkillFromFiles("b1", "my-skill", [{ path: "other.md", content: "a" }]),
    ).rejects.toThrow("SKILL.md");
  });

  it("inserts skill and file rows", async () => {
    mockDb.query.skills.findFirst.mockResolvedValue(null);
    const res = await installSkillFromFiles("b1", "my-skill", [
      { path: "SKILL.md", content: "# hi" },
      { path: "reference/adapt.md", content: "more" },
    ]);
    expect(res.skillId).toBe("skill-1");
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
