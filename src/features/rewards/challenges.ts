import { PERFECT_DAY_MIN, reviewsOf, type DayActivity } from "@/features/learning/statistics";

// One challenge per calendar month (UTC), rotating through three kinds.
// Its badge can only be earned during that month.
export const CHALLENGE_KINDS = [
  { kind: "reviews", target: 300 },
  { kind: "activeDays", target: 20 },
  { kind: "perfectDays", target: 5 },
] as const;

export type ChallengeKind = (typeof CHALLENGE_KINDS)[number]["kind"];
export type Challenge = { month: string; kind: ChallengeKind; target: number; value: number; done: boolean };

// "2026-11" → the kind for that month.
export function challengeFor(month: string): { kind: ChallengeKind; target: number } {
  const [year, m] = month.split("-").map(Number);
  return CHALLENGE_KINDS[(year * 12 + m - 1) % CHALLENGE_KINDS.length];
}

function valueIn(kind: ChallengeKind, days: DayActivity[]): number {
  if (kind === "reviews") return days.reduce((sum, d) => sum + reviewsOf(d), 0);
  if (kind === "activeDays") return days.filter((d) => reviewsOf(d) > 0).length;
  return days.filter((d) => reviewsOf(d) >= PERFECT_DAY_MIN && d.forgot === 0).length;
}

export function challengeProgress(month: string, days: DayActivity[]): Challenge {
  const { kind, target } = challengeFor(month);
  const value = valueIn(
    kind,
    days.filter((d) => d.day.startsWith(month)),
  );
  return { month, kind, target, value, done: value >= target };
}

// Every month with practice, newest first, and whether its challenge was met.
export function monthlyChallenges(days: DayActivity[], today: string): { current: Challenge; past: Challenge[] } {
  const current = today.slice(0, 7);
  const months = [...new Set(days.map((d) => d.day.slice(0, 7)))].filter((m) => m < current).sort().reverse();
  return { current: challengeProgress(current, days), past: months.map((m) => challengeProgress(m, days)) };
}
