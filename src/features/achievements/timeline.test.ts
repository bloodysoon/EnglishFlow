import { describe, expect, it } from "vitest";

import { unlocksByDay, type TimelineDay } from "./timeline";

const day = (d: Partial<TimelineDay> & { day: string }): TimelineDay => ({
  active: false,
  remembered: 0,
  forgot: 0,
  xp: 0,
  mastered: 0,
  levels: {},
  added: 0,
  known: 0,
  words: [],
  boxes: {},
  practice: { count: 0, clean: 0, words: [] },
  ...d,
});

describe("unlocksByDay", () => {
  it("dates each unlock on the day it was first reached", () => {
    const result = unlocksByDay([
      // Out of order on purpose: the replay sorts by day.
      day({ day: "2026-11-20", active: true, remembered: 6, forgot: 1, xp: 73, levels: { A1: 7 } }),
      day({ day: "2026-11-01", added: 12 }),
      day({ day: "2026-11-02", active: true, remembered: 3, xp: 30, levels: { A1: 3 } }),
    ]);

    expect(result.get("2026-11-01")).toEqual([{ kind: "track", id: "words", target: 10 }]);
    expect(result.get("2026-11-02")).toEqual([{ kind: "badge", id: "firstStep" }]);
    expect(result.get("2026-11-20")).toEqual(
      expect.arrayContaining([
        { kind: "track", id: "reviews", target: 10 },
        { kind: "track", id: "xp", target: 100 },
        // 17 days away from the last review.
        { kind: "badge", id: "comeback" },
      ]),
    );
  });

  it("returns nothing for an empty history", () => {
    expect(unlocksByDay([]).size).toBe(0);
  });
});
