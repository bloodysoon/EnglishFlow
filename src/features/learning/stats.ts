import { LAST_BOX, LEITNER_BOXES } from "@/features/leitner/boxes";

// Dates are UTC days ("YYYY-MM-DD"), the same days the database uses
// (current_date). Learners east of UTC see the day change a few hours
// after midnight; good enough until we store a time zone per learner.
export function utcDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDay(date);
}

export type UserWordRow = {
  box: number;
  due_on: string | null; // null = still waiting in the queue
  introduced_on: string | null;
  known?: boolean; // marked "I know it": outside the queue and the boxes
  // Rows arrive grouped from my_learning_summary(); 1 if missing.
  count?: number;
};

export type LearningStats = {
  total: number;
  dueToday: number;
  queued: number;
  known: number;
  introducedToday: number;
  mastered: number;
  perBox: Record<number, number>;
  nextDueOn: string | null; // earliest day after today with reviews
};

export function learningStats(rows: UserWordRow[], today: string): LearningStats {
  const perBox = Object.fromEntries(LEITNER_BOXES.map(({ box }) => [box, 0])) as Record<number, number>;
  let dueToday = 0;
  let queued = 0;
  let known = 0;
  let introducedToday = 0;
  let mastered = 0;
  let nextDueOn: string | null = null;

  let total = 0;

  for (const row of rows) {
    const n = row.count ?? 1;
    if (row.known) {
      known += n;
      continue;
    }
    total += n;
    if (row.due_on === null) {
      queued += n;
      continue;
    }
    perBox[row.box] = (perBox[row.box] ?? 0) + n;
    if (row.box === LAST_BOX) mastered += n;
    if (row.introduced_on === today) introducedToday += n;
    if (row.due_on <= today) dueToday += n;
    else if (nextDueOn === null || row.due_on < nextDueOn) nextDueOn = row.due_on;
  }

  return { total, dueToday, queued, known, introducedToday, mastered, perBox, nextDueOn };
}

// Days in a row with at least one review, ending today, or yesterday if
// the learner has not practised yet today (the streak is still alive).
export function streakDays(activityDays: Iterable<string>, today: string): number {
  const days = new Set(activityDays);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
