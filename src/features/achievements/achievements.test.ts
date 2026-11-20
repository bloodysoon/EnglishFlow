import { describe, expect, it } from "vitest";

import type { DayActivity } from "@/features/learning/statistics";
import {
  achievements,
  badges,
  hasComeback,
  hasFullWeekend,
  trackProgress,
  type AchievementInput,
} from "./achievements";

const day = (d: string, remembered: number, forgot = 0): DayActivity => ({ day: d, remembered, forgot, xp: 0 });

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
  nightReviews: 0,
  earlyReviews: 0,
  longestCleanRun: 0,
  phoenixWords: 0,
  topicMastered: {},
};

describe("trackProgress", () => {
  it("starts at level 0, heading for the first target", () => {
    expect(trackProgress("streak", 0)).toMatchObject({ tier: 0, next: 3, toNext: 0 });
  });

  it("measures the way between two targets", () => {
    // streak targets 3, 7: 5 is halfway.
    expect(trackProgress("streak", 5)).toMatchObject({ tier: 1, next: 7, toNext: 0.5 });
  });

  it("counts a target as reached when equal, and caps at the last", () => {
    expect(trackProgress("level", 5).tier).toBe(1);
    expect(trackProgress("level", 999)).toMatchObject({ tier: 4, next: null, toNext: 1 });
  });
});

describe("hasComeback", () => {
  it("needs a gap of more than a week", () => {
    expect(hasComeback(["2026-01-01", "2026-01-08"])).toBe(false);
    expect(hasComeback(["2026-01-09", "2026-01-01"])).toBe(true);
  });
});

describe("hasFullWeekend", () => {
  it("needs a Saturday and the next Sunday", () => {
    // 2026-11-14 is a Saturday.
    expect(hasFullWeekend(["2026-11-14", "2026-11-15"])).toBe(true);
    expect(hasFullWeekend(["2026-11-15", "2026-11-21"])).toBe(false);
  });
});

describe("badges", () => {
  it("earns nothing without activity", () => {
    expect(Object.values(badges(empty)).some(Boolean)).toBe(false);
  });

  it("reads each condition from the input", () => {
    const earned = badges({
      ...empty,
      days: [day("2026-11-14", 20), day("2026-11-15", 3, 1)],
      levels: ["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => ({ level, remembered: 60, forgot: 0 })),
      perBox: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
      hardWords: [{ box: 5 }],
      reviews: 100,
      accuracy: 0.9,
      sentences: 1,
      wordTenses: 12,
    });
    expect(earned).toEqual({
      firstStep: true,
      comeback: false,
      weekendWarrior: true,
      flawless: true,
      sharpshooter: true,
      allLevels: true,
      advanced: true,
      fullHouse: true,
      leechSlayer: true,
      perfectWeek: false,
      firstSentence: true,
      tenseMaster: true,
      nightOwl: false,
      earlyBird: false,
      cleanSweep: false,
      phoenix: false,
    });
  });

  it("reads the secret badges from the extras", () => {
    const earned = badges({ ...empty, nightReviews: 1, earlyReviews: 1, longestCleanRun: 30, phoenixWords: 1 });
    expect([earned.nightOwl, earned.earlyBird, earned.cleanSweep, earned.phoenix]).toEqual([true, true, true, true]);
    expect(badges({ ...empty, longestCleanRun: 29 }).cleanSweep).toBe(false);
  });

  it("needs seven perfect days in a row for a perfect week", () => {
    const week = Array.from({ length: 7 }, (_, i) => day(`2026-11-0${i + 1}`, 5));
    expect(badges({ ...empty, days: week }).perfectWeek).toBe(true);
    // A forgotten word on day 4 breaks the run.
    week[3] = day("2026-11-04", 5, 1);
    expect(badges({ ...empty, days: week }).perfectWeek).toBe(false);
  });

  it("needs all twelve tenses on one word for tense master", () => {
    expect(badges({ ...empty, wordTenses: 11, tensesUsed: 12 }).tenseMaster).toBe(false);
  });

  it("does not count a day with mistakes as flawless", () => {
    expect(badges({ ...empty, days: [day("2026-01-01", 30, 1)] }).flawless).toBe(false);
  });
});

describe("achievements", () => {
  it("counts unlocked levels and badges against the total", () => {
    const result = achievements({ ...empty, longestStreak: 7, reviews: 10 });
    // streak: 3 and 7; reviews: 10; badge firstStep.
    expect(result.unlocked).toBe(4);
    expect(achievements({ ...empty, sentences: 10, cleanSentences: 10, tensesUsed: 3 }).unlocked).toBe(
      // sentences 10, clean 10, tenses 3, badge firstSentence.
      4,
    );
    expect(result.total).toBeGreaterThan(result.unlocked);
    // A topic badge needs TOPIC_MASTERY words of that topic in box 5.
    const topics = achievements({ ...empty, topicMastered: { travel: 20, food: 19 } });
    expect(topics.topics.filter((t) => t.earned).map((t) => t.id)).toEqual(["travel"]);
  });
});
