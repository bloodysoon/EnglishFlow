// Single source of truth for the Leitner schedule. The landing page shows
// these intervals, and the review scheduler must use the same ones.
export const LEITNER_BOXES = [
  { box: 1, intervalDays: 1, label: "New words" },
  { box: 2, intervalDays: 3, label: "Getting there" },
  { box: 3, intervalDays: 7, label: "Sticking" },
  { box: 4, intervalDays: 14, label: "Almost yours" },
  { box: 5, intervalDays: 30, label: "Mastered" },
] as const;

export type LeitnerBox = (typeof LEITNER_BOXES)[number];

// Human wording for a review interval: "every day", "every 3 days",
// "every week", "every 2 weeks", "every month".
export function formatReviewInterval(days: number): string {
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError(`Interval must be a positive whole number of days, got ${days}`);
  }

  if (days === 1) return "every day";
  if (days === 30) return "every month";
  if (days % 7 === 0) {
    const weeks = days / 7;
    return weeks === 1 ? "every week" : `every ${weeks} weeks`;
  }

  return `every ${days} days`;
}

export const FIRST_BOX = LEITNER_BOXES[0].box;
export const LAST_BOX = LEITNER_BOXES[LEITNER_BOXES.length - 1].box;

// The Leitner rule: remembered moves a word up one box (it stays in the
// last box once mastered); forgotten sends it back to the first box.
export function nextBox(currentBox: number, remembered: boolean): number {
  if (!Number.isInteger(currentBox) || currentBox < FIRST_BOX || currentBox > LAST_BOX) {
    throw new RangeError(`Box must be a whole number from ${FIRST_BOX} to ${LAST_BOX}, got ${currentBox}`);
  }

  if (!remembered) return FIRST_BOX;
  return Math.min(currentBox + 1, LAST_BOX);
}
