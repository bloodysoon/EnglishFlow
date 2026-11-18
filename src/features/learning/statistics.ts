import { addDays } from "./stats";

// Pure helpers for the statistics page. Days are UTC "YYYY-MM-DD", like
// the rest of the learning code (see stats.ts).

export type DayActivity = {
  day: string;
  remembered: number;
  forgot: number;
  xp: number;
};

export type LevelAccuracy = {
  level: string;
  remembered: number;
  forgot: number;
};

export type Statistics = {
  today: string;
  // Sorted by day; only days with at least one event.
  days: DayActivity[];
  // 24 counts, index = UTC hour.
  hoursUtc: number[];
  levels: LevelAccuracy[];
  mastery: { count: number; avgDays: number | null };
};

export const reviewsOf = (d: { remembered: number; forgot: number }) => d.remembered + d.forgot;

export const accuracyOf = (d: { remembered: number; forgot: number }): number | null =>
  reviewsOf(d) > 0 ? d.remembered / reviewsOf(d) : null;

// Days between two UTC days, b - a.
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export type Streak = { length: number; start: string; end: string };

// Longest run of consecutive days in the list (any order, duplicates ok).
export function longestStreak(days: Iterable<string>): Streak | null {
  const sorted = [...new Set(days)].sort();
  let best: Streak | null = null;
  let start = sorted[0];

  for (let i = 0; i < sorted.length; i++) {
    const end = sorted[i];
    if (i > 0 && daysBetween(sorted[i - 1], end) !== 1) start = end;
    const length = daysBetween(start, end) + 1;
    if (!best || length > best.length) best = { length, start, end };
  }
  return best;
}

export type ActivitySummary = {
  reviews: number;
  remembered: number;
  forgot: number;
  accuracy: number | null;
  activeDays: number;
  // The day with the most reviews; the earlier one on a tie.
  bestDay: DayActivity | null;
  // At least PERFECT_DAY_MIN reviews and nothing forgotten.
  perfectDays: number;
  avgReviewsPerActiveDay: number;
  firstDay: string | null;
};

export const PERFECT_DAY_MIN = 5;

export function activitySummary(days: DayActivity[]): ActivitySummary {
  let remembered = 0;
  let forgot = 0;
  let bestDay: DayActivity | null = null;
  let perfectDays = 0;
  let reviewDays = 0;

  for (const day of days) {
    remembered += day.remembered;
    forgot += day.forgot;
    const reviews = reviewsOf(day);
    if (reviews > 0) reviewDays++;
    if (reviews >= PERFECT_DAY_MIN && day.forgot === 0) perfectDays++;
    if (reviews > 0 && (!bestDay || reviews > reviewsOf(bestDay))) bestDay = day;
  }

  const reviews = remembered + forgot;
  return {
    reviews,
    remembered,
    forgot,
    accuracy: accuracyOf({ remembered, forgot }),
    activeDays: days.length,
    bestDay,
    perfectDays,
    avgReviewsPerActiveDay: reviewDays > 0 ? Math.round(reviews / reviewDays) : 0,
    firstDay: days.length > 0 ? days.reduce((min, d) => (d.day < min ? d.day : min), days[0].day) : null,
  };
}

// The last n days ending today, oldest first, zeros where nothing happened.
export function lastNDays(days: DayActivity[], today: string, n: number): DayActivity[] {
  const byDay = new Map(days.map((d) => [d.day, d]));
  return Array.from({ length: n }, (_, i) => {
    const day = addDays(today, i - n + 1);
    return byDay.get(day) ?? { day, remembered: 0, forgot: 0, xp: 0 };
  });
}

// Accuracy over the last `window` days vs the `window` days before them.
export function accuracyTrend(days: DayActivity[], today: string, window = 30) {
  const sum = (list: DayActivity[]) =>
    accuracyOf(
      list.reduce(
        (acc, d) => ({
          remembered: acc.remembered + d.remembered,
          forgot: acc.forgot + d.forgot,
        }),
        { remembered: 0, forgot: 0 },
      ),
    );
  const both = lastNDays(days, today, window * 2);
  return {
    previous: sum(both.slice(0, window)),
    current: sum(both.slice(window)),
  };
}

// Reviews per weekday, Monday first.
export function weekdayTotals(days: DayActivity[]): number[] {
  const totals = Array<number>(7).fill(0);
  for (const d of days) totals[(new Date(`${d.day}T00:00:00Z`).getUTCDay() + 6) % 7] += reviewsOf(d);
  return totals;
}

export type HeatCell = { day: string; reviews: number } | null;

// Calendar columns (weeks, Monday first) covering about `weeks` weeks up to
// today. Days after today are null.
export function heatmapWeeks(days: DayActivity[], today: string, weeks = 53): HeatCell[][] {
  const byDay = new Map(days.map((d) => [d.day, reviewsOf(d)]));
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const firstMonday = addDays(today, -weekday - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(firstMonday, w * 7 + d);
      return day > today ? null : { day, reviews: byDay.get(day) ?? 0 };
    }),
  );
}

// 0 = nothing, 1–4 = quarters of the busiest day.
export function intensity(reviews: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (reviews <= 0 || max <= 0) return 0;
  return Math.min(4, Math.ceil((reviews / max) * 4)) as 1 | 2 | 3 | 4;
}

// UTC hour counts → the viewer's local hours. offsetMinutes = local - UTC
// (e.g. +120 in Chisinau in winter). shortcut: half-hour zones round to
// the nearest hour; fine for a "when do I study" chart.
export function shiftHours(hoursUtc: number[], offsetMinutes: number): number[] {
  const shift = Math.round(offsetMinutes / 60);
  return Array.from({ length: 24 }, (_, local) => hoursUtc[(((local - shift) % 24) + 24) % 24] ?? 0);
}

// Index of the largest value, or -1 if all are zero.
export function peakIndex(values: number[]): number {
  let best = -1;
  values.forEach((v, i) => {
    if (v > 0 && (best === -1 || v > values[best])) best = i;
  });
  return best;
}
