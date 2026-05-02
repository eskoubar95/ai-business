import { describe, expect, it } from "vitest";

import {
  grillMeModelFromEnv,
  grillMeSettingSourcesFromEnv,
  mergeGrillMeCursorAgentOptions,
} from "../grill-cursor-runtime";

function testEnv(vars: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...vars } as NodeJS.ProcessEnv;
}

describe("grill-cursor-runtime", () => {
  it("defaults setting sources to project when env key missing", () => {
    expect(grillMeSettingSourcesFromEnv(testEnv({}))).toEqual(["project"]);
  });

  it("parses comma-separated validated layers", () => {
    const env = testEnv({
      CURSOR_GRILL_ME_SETTING_SOURCES: "project,user",
    });
    expect(grillMeSettingSourcesFromEnv(env)).toEqual(["project", "user"]);
  });

  it("drops unknown tokens safely", () => {
    const env = testEnv({
      CURSOR_GRILL_ME_SETTING_SOURCES: "project,planet-mars,user",
    });
    expect(grillMeSettingSourcesFromEnv(env)).toEqual(["project", "user"]);
  });

  it("supports explicit none/off", () => {
    expect(grillMeSettingSourcesFromEnv(testEnv({ CURSOR_GRILL_ME_SETTING_SOURCES: "none" }))).toEqual([]);
    expect(grillMeSettingSourcesFromEnv(testEnv({ CURSOR_GRILL_ME_SETTING_SOURCES: "OFF" }))).toEqual([]);
  });

  it("parses optional model JSON params", () => {
    const env = testEnv({
      CURSOR_GRILL_ME_MODEL_ID: "composer-2",
      CURSOR_GRILL_ME_MODEL_PARAMS_JSON: `[{"id":"x","value":"y"}]`,
    });
    expect(grillMeModelFromEnv(env)).toEqual({
      id: "composer-2",
      params: [{ id: "x", value: "y" }],
    });
  });

  it("mergeGrillMeCursorAgentOptions merges key + Grill env", () => {
    const env = testEnv({
      CURSOR_GRILL_ME_MODEL_ID: "auto",
      CURSOR_GRILL_ME_SETTING_SOURCES: "none",
    });
    const merged = mergeGrillMeCursorAgentOptions("secret-key", env);
    expect(merged).toMatchObject({
      apiKey: "secret-key",
      model: { id: "auto" },
      localSettingSources: [],
    });
  });
});
