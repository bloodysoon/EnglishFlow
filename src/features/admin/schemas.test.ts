import { describe, expect, it } from "vitest";

import { DEFAULT_XP_RULES } from "@/features/leitner/xp";
import { appSettingsSchema, publishWordSetSchema, wordEditSchema, xpRulesSchema } from "./schemas";

const settings = { defaultTranslationLanguage: "ru", defaultDailyGoal: 10, dailyGoalOptions: [5, 10, 20] };

describe("appSettingsSchema", () => {
  it("accepts the current defaults", () => {
    expect(appSettingsSchema.safeParse(settings).success).toBe(true);
  });

  it("requires the default goal to be one of the options", () => {
    const result = appSettingsSchema.safeParse({ ...settings, defaultDailyGoal: 15 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("default_not_an_option");
  });

  it.each([
    { ...settings, dailyGoalOptions: [] },
    { ...settings, dailyGoalOptions: [5, 5, 10] },
    { ...settings, dailyGoalOptions: [1, 2, 3, 4, 5, 6, 10] },
    { ...settings, dailyGoalOptions: [0, 10] },
    { ...settings, defaultTranslationLanguage: "en" },
  ])("rejects %j", (input) => {
    expect(appSettingsSchema.safeParse(input).success).toBe(false);
  });
});

describe("xpRulesSchema", () => {
  it("accepts the defaults", () => {
    expect(xpRulesSchema.safeParse(DEFAULT_XP_RULES).success).toBe(true);
  });

  it("keeps values inside the database limits", () => {
    expect(xpRulesSchema.safeParse({ ...DEFAULT_XP_RULES, remembered: 101 }).success).toBe(false);
    expect(xpRulesSchema.safeParse({ ...DEFAULT_XP_RULES, masteredBonus: 201 }).success).toBe(false);
    const multipliers = { ...DEFAULT_XP_RULES.multipliers };
    expect(xpRulesSchema.safeParse({ ...DEFAULT_XP_RULES, multipliers: { ...multipliers, C2: 5.5 } }).success).toBe(false);
    expect(xpRulesSchema.safeParse({ ...DEFAULT_XP_RULES, multipliers: { ...multipliers, B1: 1.25 } }).success).toBe(false);
    expect(xpRulesSchema.safeParse({ ...DEFAULT_XP_RULES, multipliers: { ...multipliers, B1: 1.3 } }).success).toBe(true);
  });
});

describe("content schemas", () => {
  const wordId = "6f1c1b0e-8a7b-4c1e-9a65-1f2d3c4b5a69";

  it("accepts a word edit and a removed translation", () => {
    expect(
      wordEditSchema.safeParse({
        wordId,
        level: "B1",
        translations: { ru: { translation: "стойкий", alternatives: ["упругий"], reviewed: true }, ro: null },
      }).success,
    ).toBe(true);
  });

  it("rejects empty translations, bad ids and unknown levels", () => {
    const base = { wordId, level: null, translations: { ru: null, ro: null } };
    expect(wordEditSchema.safeParse({ ...base, wordId: "1; drop table" }).success).toBe(false);
    expect(wordEditSchema.safeParse({ ...base, level: "D1" }).success).toBe(false);
    expect(
      wordEditSchema.safeParse({ ...base, translations: { ru: { translation: "  ", alternatives: [], reviewed: true }, ro: null } })
        .success,
    ).toBe(false);
  });

  it("validates the publish toggle", () => {
    expect(publishWordSetSchema.safeParse({ setId: wordId, published: true }).success).toBe(true);
    expect(publishWordSetSchema.safeParse({ setId: wordId, published: "yes" }).success).toBe(false);
  });
});
