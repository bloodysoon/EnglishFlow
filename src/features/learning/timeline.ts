import { FIRST_BOX, LAST_BOX } from "@/features/leitner/boxes";
import type { PracticeEntry } from "@/features/writing/history";

// One row of the xp_events log for a word.
export type WordEvent = { reason: string; amount: number; at: string };

export type TimelineStep = {
  kind: "added" | "known" | "remembered" | "forgot" | "mastered" | "practice";
  at: string; // ISO timestamp
  xp: number;
  // Box before and after a review.
  from?: number;
  to?: number;
  // The sentence, for a practice step.
  practice?: PracticeEntry;
};

const KINDS: Record<string, TimelineStep["kind"]> = {
  review_remembered: "remembered",
  review_forgot: "forgot",
  word_mastered: "mastered",
  word_known: "known",
};

// A word's story, oldest first. The log does not store boxes, so they are
// replayed with the Leitner rule: remembered → up one box, forgot → box 1.
// shortcut: boxes are replayed, not stored; a word removed and added again restarts at box 1 here. Store the box on the event if that ever differs.
export function wordTimeline(addedAt: string, events: WordEvent[]): TimelineStep[] {
  const rows = [
    { kind: "added" as const, at: addedAt, xp: 0 },
    ...events.flatMap((e) => (KINDS[e.reason] ? [{ kind: KINDS[e.reason], at: e.at, xp: e.amount }] : [])),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  let box: number = FIRST_BOX;
  return rows.map((row): TimelineStep => {
    if (row.kind === "added") box = FIRST_BOX;
    if (row.kind !== "remembered" && row.kind !== "forgot") return row;
    const from = box;
    box = row.kind === "remembered" ? Math.min(box + 1, LAST_BOX) : FIRST_BOX;
    return { ...row, from, to: box };
  });
}

// Practice sentences slotted into a word's story by time.
export function withPractice(steps: TimelineStep[], practice: PracticeEntry[]): TimelineStep[] {
  return [...steps, ...practice.map((p): TimelineStep => ({ kind: "practice", at: p.at, xp: 0, practice: p }))].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  );
}
