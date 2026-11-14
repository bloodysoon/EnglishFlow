import { describe, expect, it } from "vitest";

import { learningStats, streakDays, utcDay } from "./stats";

const today = "2026-11-14";

describe("utcDay", () => {
  it("uses the UTC calendar day", () => {
    expect(utcDay(new Date("2026-11-14T23:30:00-05:00"))).toBe("2026-11-15");
  });
});

describe("learningStats", () => {
  it("counts due, queued, introduced and mastered words", () => {
    const stats = learningStats(
      [
        { box: 1, due_on: "2026-11-14", introduced_on: "2026-11-14" },
        { box: 2, due_on: "2026-11-13", introduced_on: "2026-11-10" },
        { box: 3, due_on: "2026-11-20", introduced_on: "2026-11-01" },
        { box: 5, due_on: "2026-11-17", introduced_on: "2026-10-01" },
        { box: 1, due_on: null, introduced_on: null },
        { box: 1, due_on: null, introduced_on: null },
      ],
      today,
    );

    expect(stats).toEqual({
      total: 6,
      dueToday: 2,
      queued: 2,
      introducedToday: 1,
      mastered: 1,
      perBox: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 1 },
      nextDueOn: "2026-11-17",
    });
  });

  it("weights grouped rows by their count", () => {
    const stats = learningStats(
      [
        { box: 2, due_on: "2026-11-14", introduced_on: "2026-11-12", count: 7 },
        { box: 1, due_on: null, introduced_on: null, count: 30 },
      ],
      today,
    );
    expect(stats).toMatchObject({ total: 37, dueToday: 7, queued: 30, perBox: { 2: 7 } });
  });

  it("handles a learner with no words", () => {
    expect(learningStats([], today)).toMatchObject({ total: 0, dueToday: 0, nextDueOn: null });
  });
});

describe("streakDays", () => {
  it("counts consecutive days ending today", () => {
    expect(streakDays(["2026-11-14", "2026-11-13", "2026-11-12", "2026-11-10"], today)).toBe(3);
  });

  it("keeps yesterday's streak alive before today's practice", () => {
    expect(streakDays(["2026-11-13", "2026-11-12"], today)).toBe(2);
  });

  it("is zero after a missed day", () => {
    expect(streakDays(["2026-11-12", "2026-11-11"], today)).toBe(0);
    expect(streakDays([], today)).toBe(0);
  });

  it("crosses month boundaries", () => {
    expect(streakDays(["2026-12-01", "2026-11-30", "2026-11-29"], "2026-12-01")).toBe(3);
  });
});
