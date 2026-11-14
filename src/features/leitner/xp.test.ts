import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { CEFR_LEVELS } from "@/features/dictionary/cefr";
import { LEITNER_BOXES } from "./boxes";
import { CEFR_XP_MULTIPLIER, XP_MASTERED_BONUS, XP_PER_REVIEW, learnerLevel, reviewXp, xpForLevel } from "./xp";

describe("reviewXp", () => {
  it("gives base XP times the word's level multiplier", () => {
    expect(reviewXp(1, true, "A1").xp).toBe(10);
    expect(reviewXp(1, true, "B1").xp).toBe(15);
    expect(reviewXp(2, true, "C2").xp).toBe(30);
  });

  it("still rewards an honest 'forgot'", () => {
    expect(reviewXp(3, false, "A1")).toEqual({ xp: 3, bonus: 0, mastered: false, newBox: 1 });
    expect(reviewXp(3, false, "B1").xp).toBe(5); // 4.5 rounds up
  });

  it("treats an unknown level like A1", () => {
    expect(reviewXp(1, true, null).xp).toBe(10);
  });

  it("adds the mastered bonus only when a word moves from box 4 to 5", () => {
    expect(reviewXp(4, true, "B2")).toEqual({ xp: 20 + 100, bonus: 100, mastered: true, newBox: 5 });
    expect(reviewXp(5, true, "B2")).toMatchObject({ bonus: 0, mastered: false, newBox: 5 });
    expect(reviewXp(4, false, "B2")).toMatchObject({ bonus: 0, mastered: false, newBox: 1 });
  });
});

describe("learner levels", () => {
  it("follows the 100 × (level − 1)^1.5 curve", () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 283, 520, 800]);
  });

  it("finds the level and progress inside it", () => {
    expect(learnerLevel(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 100 });
    expect(learnerLevel(99).level).toBe(1);
    expect(learnerLevel(100)).toEqual({ level: 2, xpIntoLevel: 0, xpForNextLevel: 183 });
    expect(learnerLevel(600)).toEqual({ level: 4, xpIntoLevel: 80, xpForNextLevel: 280 });
  });

  it("is safe with odd input", () => {
    expect(learnerLevel(-50).level).toBe(1);
    expect(learnerLevel(Number.NaN).level).toBe(1);
    expect(() => xpForLevel(0)).toThrow(RangeError);
  });
});

// The database function review_word applies these rules on its own. Read
// the migration and make sure its numbers match the TypeScript ones.
describe("review_word in SQL matches the TypeScript rules", () => {
  const sql = readFileSync(
    path.join(process.cwd(), "supabase/migrations/20261114120000_progress_xp.sql"),
    "utf8",
  );

  it("uses the same review intervals", () => {
    const intervals = sql.match(/v_interval := case v_new_box (.*?) end;/)?.[1] ?? "";
    for (const { box, intervalDays } of LEITNER_BOXES) {
      expect(intervals).toContain(`when ${box} then ${intervalDays}`);
    }
  });

  it("uses the same CEFR multipliers", () => {
    for (const level of CEFR_LEVELS) {
      expect(sql).toMatch(new RegExp(`when '${level}' then ${CEFR_XP_MULTIPLIER[level]}\\b`));
    }
  });

  it("uses the same base XP and bonus", () => {
    expect(sql).toContain(
      `case when p_remembered then ${XP_PER_REVIEW.remembered} else ${XP_PER_REVIEW.forgot} end`,
    );
    expect(sql).toContain(`round(${XP_MASTERED_BONUS} * v_multiplier)`);
    expect(sql).toContain("least(v_box + 1, 5)");
    expect(sql).toContain("p_remembered and v_box = 4");
  });
});
