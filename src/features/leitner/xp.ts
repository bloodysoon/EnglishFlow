import type { CefrLevel } from "@/features/dictionary/cefr";
import { LAST_BOX, nextBox } from "./boxes";

// XP rules. The live numbers sit in the public.xp_rules table (editable
// in the admin panel) and public.review_word applies them. These are the
// defaults that table starts with; xp.test.ts checks the migration
// matches them.

export type XpRules = {
  // Honest "forgot" still earns something, so nobody is tempted to lie.
  remembered: number;
  forgot: number;
  // Bonus for moving a word from box 4 into the last box (mastered).
  masteredBonus: number;
  // Harder words are worth more. Unknown level counts as A1.
  multipliers: Record<CefrLevel, number>;
};

export const DEFAULT_XP_RULES: XpRules = {
  remembered: 10,
  forgot: 3,
  masteredBonus: 50,
  multipliers: { A1: 1, A2: 1.2, B1: 1.5, B2: 2, C1: 2.5, C2: 3 },
};

export type ReviewXp = {
  xp: number; // total for this answer, bonus included
  bonus: number;
  mastered: boolean;
  newBox: number;
};

// XP for answering one due word that sat in `box` (same maths as
// public.review_word; used for previews in the admin panel).
export function reviewXp(
  box: number,
  remembered: boolean,
  level: CefrLevel | null,
  rules: XpRules = DEFAULT_XP_RULES,
): ReviewXp {
  const multiplier = rules.multipliers[level ?? "A1"];
  const newBox = nextBox(box, remembered);
  const mastered = remembered && box === LAST_BOX - 1;

  const base = Math.round((remembered ? rules.remembered : rules.forgot) * multiplier);
  const bonus = mastered ? Math.round(rules.masteredBonus * multiplier) : 0;

  return { xp: base + bonus, bonus, mastered, newBox };
}

// Total XP needed to reach a learner level: level 1 at 0 XP, then a
// gently steepening curve (100, 283, 520, 800, 1118, …).
export function xpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError(`Level must be a whole number from 1, got ${level}`);
  }
  return Math.round(100 * (level - 1) ** 1.5);
}

export type LearnerLevel = {
  level: number;
  // XP gathered inside the current level, and needed to finish it.
  xpIntoLevel: number;
  xpForNextLevel: number;
};

export function learnerLevel(totalXp: number): LearnerLevel {
  const xp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0));

  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;

  const start = xpForLevel(level);
  return { level, xpIntoLevel: xp - start, xpForNextLevel: xpForLevel(level + 1) - start };
}
