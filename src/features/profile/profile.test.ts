import { describe, expect, it } from "vitest";

import { achievements, type AchievementInput } from "@/features/achievements/achievements";
import { currentStreak, publicStats, publicStatsSchema, usernameSchema } from "./profile";

const empty: AchievementInput = {
  days: [],
  levels: [],
  perBox: {},
  hardWords: [],
  longestStreak: 0,
  reviews: 0,
  accuracy: null,
  mastered: 0,
  words: 0,
  known: 0,
  xp: 0,
  level: 1,
  perfectDays: 0,
  bestDay: 0,
  activeDays: 0,
  sentences: 0,
  cleanSentences: 0,
  tensesUsed: 0,
  wordTenses: 0,
};

describe("usernameSchema", () => {
  it("lowercases and trims, like the database stores it", () => {
    expect(usernameSchema.parse("  Serj_01 ")).toBe("serj_01");
  });

  it("rejects what the database check rejects", () => {
    for (const bad of ["ab", "a".repeat(21), "with space", "dot.name", "emoji😀", "ion-popescu"]) {
      expect(usernameSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("publicStats", () => {
  it("keeps only level, streak, earned badges and reached milestones", () => {
    const result = achievements({ ...empty, reviews: 10, longestStreak: 3 });
    const stats = publicStats(result, 2, 3, "2026-11-19");
    expect(stats).toEqual({
      level: 2,
      streak: 3,
      streakDay: "2026-11-19",
      badges: ["firstStep"],
      tracks: { streak: 1, reviews: 1 },
    });
    expect(publicStatsSchema.parse(stats)).toEqual(stats);
  });
});

describe("currentStreak", () => {
  const stats = publicStats(achievements(empty), 1, 5, "2026-11-19");

  it("holds through the next day", () => {
    expect(currentStreak(stats, "2026-11-20")).toBe(5);
  });

  it("lapses after a missed day", () => {
    expect(currentStreak(stats, "2026-11-21")).toBe(0);
  });
});

describe("publicStatsSchema", () => {
  it("rejects unknown badges written into the row", () => {
    const stats = publicStats(achievements(empty), 1, 0, "2026-11-19");
    expect(publicStatsSchema.safeParse({ ...stats, badges: ["madeUp"] }).success).toBe(false);
  });
});
