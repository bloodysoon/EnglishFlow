import {
  daysBetween,
  longestStreak,
  PERFECT_DAY_MIN,
  reviewsOf,
  type DayActivity,
  type LevelAccuracy,
} from "@/features/learning/statistics";
import { TENSES } from "@/features/writing/tenses";

// Achievements are derived from data we already keep (review log, boxes,
// XP); nothing is stored. shortcut: no unlock dates; store unlocks in a
// table once we want "unlocked on …" or notifications.

// Milestone tracks: each target reached is one level.
export const TRACKS = {
  streak: [3, 7, 14, 30, 60, 100, 365],
  reviews: [10, 100, 500, 1_000, 5_000, 10_000],
  mastered: [1, 10, 50, 100, 250, 500],
  words: [10, 50, 100, 500, 1_000],
  known: [10, 50, 100, 500],
  xp: [100, 1_000, 5_000, 10_000, 50_000],
  level: [5, 10, 20, 50],
  perfectDays: [1, 5, 10, 30, 100],
  bestDay: [20, 50, 100, 200],
  activeDays: [7, 30, 100, 365],
  // Writing practice on word pages.
  sentences: [10, 50, 100, 500, 1_000],
  cleanSentences: [10, 50, 100, 500],
  tensesUsed: [3, 6, 9, TENSES.length],
} as const satisfies Record<string, readonly number[]>;

export type TrackId = keyof typeof TRACKS;
export const TRACK_IDS = Object.keys(TRACKS) as TrackId[];

export type TrackProgress = {
  id: TrackId;
  value: number;
  targets: readonly number[];
  tier: number; // targets reached
  next: number | null; // null once every target is reached
  // Share of the way from the previous target to the next, 0–1.
  toNext: number;
};

export function trackProgress(id: TrackId, value: number): TrackProgress {
  const targets = TRACKS[id];
  const tier = targets.filter((t) => value >= t).length;
  const next = targets[tier] ?? null;
  const previous = tier > 0 ? targets[tier - 1] : 0;
  const toNext = next === null ? 1 : Math.max(0, Math.min(1, (value - previous) / (next - previous)));
  return { id, value, targets, tier, next, toNext };
}

export const BADGE_IDS = [
  "firstStep",
  "comeback",
  "weekendWarrior",
  "flawless",
  "sharpshooter",
  "allLevels",
  "advanced",
  "fullHouse",
  "leechSlayer",
  "perfectWeek",
  "firstSentence",
  "tenseMaster",
] as const;

export type BadgeId = (typeof BADGE_IDS)[number];

export const FLAWLESS_MIN = 20;
export const SHARPSHOOTER = { accuracy: 0.9, minReviews: 100 };
export const ADVANCED_MIN = 100;
export const COMEBACK_GAP = 7;
export const PERFECT_WEEK = 7;
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];

export type AchievementInput = {
  days: DayActivity[];
  levels: LevelAccuracy[];
  perBox: Record<number, number>;
  // From the hard-word list: words forgotten twice or more.
  hardWords: { box: number }[];
  longestStreak: number;
  reviews: number;
  accuracy: number | null;
  mastered: number;
  words: number;
  known: number;
  xp: number;
  level: number;
  perfectDays: number;
  bestDay: number;
  activeDays: number;
  // Writing practice. Clean = no mistakes and, when asked, the right tense.
  sentences: number;
  cleanSentences: number;
  // Tenses with a clean sentence, overall and the most on any one word.
  tensesUsed: number;
  wordTenses: number;
};

// Practised again after at least COMEBACK_GAP days away.
export function hasComeback(days: string[]): boolean {
  const sorted = [...days].sort();
  return sorted.some((day, i) => i > 0 && daysBetween(sorted[i - 1], day) > COMEBACK_GAP);
}

// Practised on a Saturday and the Sunday right after it.
export function hasFullWeekend(days: string[]): boolean {
  const set = new Set(days);
  return days.some((day) => {
    const date = new Date(`${day}T00:00:00Z`);
    if (date.getUTCDay() !== 6) return false;
    date.setUTCDate(date.getUTCDate() + 1);
    return set.has(date.toISOString().slice(0, 10));
  });
}

export function badges(input: AchievementInput): Record<BadgeId, boolean> {
  const reviewDays = input.days.filter((d) => reviewsOf(d) > 0).map((d) => d.day);
  const reviewedLevels = new Set(input.levels.filter((l) => reviewsOf(l) > 0).map((l) => l.level));
  const advancedReviews = input.levels
    .filter((l) => l.level === "C1" || l.level === "C2")
    .reduce((sum, l) => sum + reviewsOf(l), 0);

  return {
    firstStep: input.reviews > 0,
    comeback: hasComeback(reviewDays),
    weekendWarrior: hasFullWeekend(reviewDays),
    flawless: input.days.some((d) => d.forgot === 0 && d.remembered >= FLAWLESS_MIN),
    sharpshooter: input.reviews >= SHARPSHOOTER.minReviews && (input.accuracy ?? 0) >= SHARPSHOOTER.accuracy,
    allLevels: CEFR.every((level) => reviewedLevels.has(level)),
    advanced: advancedReviews >= ADVANCED_MIN,
    fullHouse: [1, 2, 3, 4, 5].every((box) => (input.perBox[box] ?? 0) > 0),
    leechSlayer: input.hardWords.some((w) => w.box === 5),
    perfectWeek:
      (longestStreak(input.days.filter((d) => reviewsOf(d) >= PERFECT_DAY_MIN && d.forgot === 0).map((d) => d.day))
        ?.length ?? 0) >= PERFECT_WEEK,
    firstSentence: input.sentences > 0,
    tenseMaster: input.wordTenses >= TENSES.length,
  };
}

export function achievements(input: AchievementInput) {
  const tracks = TRACK_IDS.map((id) => trackProgress(id, input[id === "streak" ? "longestStreak" : id]));
  const earned = badges(input);

  const unlocked = tracks.reduce((sum, t) => sum + t.tier, 0) + BADGE_IDS.filter((id) => earned[id]).length;
  const total = tracks.reduce((sum, t) => sum + t.targets.length, 0) + BADGE_IDS.length;

  return { tracks, badges: earned, unlocked, total };
}
