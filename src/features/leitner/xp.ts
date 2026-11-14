import type { CefrLevel } from "@/features/dictionary/cefr";
import { LAST_BOX, nextBox } from "./boxes";

// XP rules. The database function public.review_word (migration
// 20261114120000_progress_xp.sql) applies the same numbers when it awards
// XP; xp.test.ts fails if the two drift apart.

export const XP_PER_REVIEW = {
  // Honest "forgot" still earns something, so nobody is tempted to lie.
  remembered: 10,
  forgot: 3,
} as const;

// Bonus for moving a word from box 4 into the last box (mastered).
export const XP_MASTERED_BONUS = 50;

// Harder words are worth more. Unknown level counts as A1.
export const CEFR_XP_MULTIPLIER: Record<CefrLevel, number> = {
  A1: 1,
  A2: 1.2,
  B1: 1.5,
  B2: 2,
  C1: 2.5,
  C2: 3,
};

export type ReviewXp = {
  xp: number; // total for this answer, bonus included
  bonus: number;
  mastered: boolean;
  newBox: number;
};

// XP for answering one due word that sat in `box`.
export function reviewXp(box: number, remembered: boolean, level: CefrLevel | null): ReviewXp {
  const multiplier = level ? CEFR_XP_MULTIPLIER[level] : 1;
  const newBox = nextBox(box, remembered);
  const mastered = remembered && box === LAST_BOX - 1;

  const base = Math.round((remembered ? XP_PER_REVIEW.remembered : XP_PER_REVIEW.forgot) * multiplier);
  const bonus = mastered ? Math.round(XP_MASTERED_BONUS * multiplier) : 0;

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
