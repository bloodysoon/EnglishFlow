// A word is due from 00:00 UTC on its due day (the review queue compares
// due_on with the UTC day), so that moment is when it can be reviewed again.
export type TimeLeft = { days: number; hours: number; minutes: number };

const MINUTE_MS = 60_000;

// Time until `dueOn` (YYYY-MM-DD) opens, rounded up to the minute; null once it is due.
export function timeUntilDue(dueOn: string, now: Date = new Date()): TimeLeft | null {
  const ms = Date.parse(`${dueOn}T00:00:00Z`) - now.getTime();
  if (ms <= 0) return null;
  const total = Math.ceil(ms / MINUTE_MS);
  return { days: Math.floor(total / 1440), hours: Math.floor((total % 1440) / 60), minutes: total % 60 };
}
