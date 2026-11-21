import { FIRST_BOX, LEITNER_BOXES, nextBox } from "@/features/leitner/boxes";

export const PLAN_DAYS = 8; // a short stretch is enough to see the rule
// Two weeks: long enough to show where each word comes back after the
// played stretch (its next review, dashed), short enough to stay calm.
export const CALENDAR_DAYS = 14;

// A review in the sample stretch: the word was in `box` on `day`, and
// moved to `next` (up one if remembered, back to Box 1 if not).
export type ReviewEvent = {
  day: number;
  word: string;
  box: number;
  remembered: boolean;
  next: number;
};

export type SampleWord = {
  word: string;
  start: number; // the day it is first reviewed
  forget?: number[]; // which of its reviews (0-based) it is forgotten on
};

// Three words through eight days; borrow slips once, on its second review.
export const SAMPLE: readonly SampleWord[] = [
  { word: "eager", start: 1 },
  { word: "borrow", start: 2, forget: [1] },
  { word: "whisper", start: 4 },
];

const intervalOf = (box: number) =>
  LEITNER_BOXES.find((b) => b.box === box)!.intervalDays;

// Plays the real Leitner schedule over `days` days: a word comes back after
// its box's interval, and moves with the same rule the app uses.
export function planMonth(
  words: readonly SampleWord[],
  days = PLAN_DAYS,
): ReviewEvent[] {
  const events: ReviewEvent[] = [];
  for (const { word, start, forget = [] } of words) {
    let box: number = FIRST_BOX;
    for (let day = start, n = 0; day <= days; n++) {
      const remembered = !forget.includes(n);
      const next = nextBox(box, remembered);
      events.push({ day, word, box, remembered, next });
      box = next;
      day += intervalOf(next);
    }
  }
  return events.sort((a, b) => a.day - b.day);
}

// Where a word sits on a given day: after its latest review so far, or
// still waiting in Box 1 before its first one.
export function boxOn(
  events: readonly ReviewEvent[],
  word: string,
  day: number,
): number {
  const last = events.filter((e) => e.word === word && e.day <= day).at(-1);
  return last ? last.next : FIRST_BOX;
}
