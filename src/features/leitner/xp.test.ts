import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { CEFR_LEVELS } from "@/features/dictionary/cefr";
import { LEITNER_BOXES } from "./boxes";
import {
  DEFAULT_XP_RULES,
  KNOWN_WORD_XP,
  KNOWN_WORD_XP_DAILY_CAP,
  knownWordXp,
  learnerLevel,
  reviewXp,
  xpForLevel,
} from "./xp";

describe("knownWordXp", () => {
  it("gives a small level-based amount, less than a review", () => {
    expect(CEFR_LEVELS.map((level) => knownWordXp(level))).toEqual([2, 2, 3, 4, 5, 6]);
    expect(knownWordXp(null)).toBe(2);
  });

  it("matches public.award_known_word_xp", () => {
    const sql = readFileSync(path.join(process.cwd(), "supabase/migrations/20261114220000_known_word_xp.sql"), "utf8");
    expect(sql).toContain(`round(${KNOWN_WORD_XP} * v_multiplier)`);
    expect(sql).toContain(`>= ${KNOWN_WORD_XP_DAILY_CAP} then`);
  });
});

describe("reviewXp", () => {
  it("gives base XP times the word's level multiplier", () => {
    expect(reviewXp(1, true, "A1").xp).toBe(10);
    expect(reviewXp(1, true, "B1").xp).toBe(15);
    expect(reviewXp(2, true, "C2").xp).toBe(30);
  });

  it("gives nothing for 'forgot': the word just drops back to box 1", () => {
    expect(reviewXp(3, false, "A1")).toEqual({ xp: 0, bonus: 0, mastered: false, newBox: 1 });
    expect(reviewXp(3, false, "C2").xp).toBe(0);
  });

  it("treats an unknown level like A1", () => {
    expect(reviewXp(1, true, null).xp).toBe(10);
  });

  it("uses the rules it is given", () => {
    const rules = { ...DEFAULT_XP_RULES, remembered: 20, multipliers: { ...DEFAULT_XP_RULES.multipliers, B1: 2 } };
    expect(reviewXp(1, true, "B1", rules).xp).toBe(40);
    expect(reviewXp(1, true, null, { ...rules, multipliers: { ...rules.multipliers, A1: 0.5 } }).xp).toBe(10);
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

// The database applies these rules on its own (public.xp_rules,
// public.review_word). Read the migration and make sure it matches.
describe("the database matches the TypeScript rules", () => {
  const read = (file: string) => readFileSync(path.join(process.cwd(), "supabase/migrations", file), "utf8");
  // xp_rules is created here…
  const sql = read("20261114140000_admin.sql");
  // …and this is the latest definition of review_word (and the forgot default).
  const latest = read("20261115120000_no_xp_for_forgot.sql");
  const reviewWord = latest.slice(latest.indexOf("create or replace function public.review_word"));

  it("starts xp_rules with the default values", () => {
    expect(sql).toMatch(new RegExp(`xp_remembered smallint not null default ${DEFAULT_XP_RULES.remembered}\\b`));
    expect(latest).toContain(`alter column xp_forgot set default ${DEFAULT_XP_RULES.forgot};`);
    expect(sql).toMatch(new RegExp(`xp_mastered_bonus smallint not null default ${DEFAULT_XP_RULES.masteredBonus}\\b`));
    for (const level of CEFR_LEVELS) {
      expect(sql).toMatch(
        new RegExp(`multiplier_${level.toLowerCase()} numeric\\(3, 1\\) not null default ${DEFAULT_XP_RULES.multipliers[level]} `),
      );
    }
  });

  it("falls back to the same defaults when the rules row is missing", () => {
    expect(reviewWord).toContain(`coalesce(v_rules.xp_remembered, ${DEFAULT_XP_RULES.remembered})`);
    expect(reviewWord).toContain(`coalesce(v_rules.xp_forgot, ${DEFAULT_XP_RULES.forgot})`);
    expect(reviewWord).toContain(`coalesce(v_rules.xp_mastered_bonus, ${DEFAULT_XP_RULES.masteredBonus})`);
  });

  it("uses the same Leitner rule and review intervals", () => {
    const intervals = reviewWord.match(/v_interval := case v_new_box (.*?) end;/)?.[1] ?? "";
    for (const { box, intervalDays } of LEITNER_BOXES) {
      expect(intervals).toContain(`when ${box} then ${intervalDays}`);
    }
    expect(reviewWord).toContain("least(v_box + 1, 5)");
    expect(reviewWord).toContain("p_remembered and v_box = 4");
  });

  it("refuses words that are still waiting in the queue", () => {
    expect(reviewWord).toContain("if v_due is null or v_due > current_date then");
  });
});
