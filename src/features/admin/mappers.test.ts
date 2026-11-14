import { describe, expect, it } from "vitest";

import { DEFAULT_APP_SETTINGS, appSettingsFromRow } from "@/features/settings/app-settings";
import { DEFAULT_XP_RULES } from "@/features/leitner/xp";
import { xpRulesFromRow, xpRulesToRow } from "./xp-rules";

describe("appSettingsFromRow", () => {
  it("reads a database row and sorts the goal options", () => {
    expect(
      appSettingsFromRow({ default_translation_language: "ro", default_daily_goal: 15, daily_goal_options: [30, 15, 5] }),
    ).toEqual({ defaultTranslationLanguage: "ro", defaultDailyGoal: 15, dailyGoalOptions: [5, 15, 30] });
  });

  it("falls back to the defaults for a missing or broken row", () => {
    expect(appSettingsFromRow(null)).toEqual(DEFAULT_APP_SETTINGS);
    expect(appSettingsFromRow({ default_translation_language: "de" })).toEqual(DEFAULT_APP_SETTINGS);
  });
});

describe("xp rules rows", () => {
  it("round-trips through the database shape (numeric arrives as text)", () => {
    const row = Object.fromEntries(Object.entries(xpRulesToRow(DEFAULT_XP_RULES)).map(([k, v]) => [k, String(v)]));
    expect(xpRulesFromRow(row)).toEqual(DEFAULT_XP_RULES);
  });

  it("falls back to the defaults for a missing or broken row", () => {
    expect(xpRulesFromRow(null)).toEqual(DEFAULT_XP_RULES);
    expect(xpRulesFromRow({ xp_remembered: "lots" })).toEqual(DEFAULT_XP_RULES);
  });
});
