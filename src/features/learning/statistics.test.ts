import { describe, expect, it } from "vitest";

import {
  accuracyTrend,
  activitySummary,
  heatmapWeeks,
  intensity,
  lastNDays,
  longestStreak,
  peakIndex,
  shiftHours,
  weekdayTotals,
  type DayActivity,
} from "./statistics";

const day = (d: string, remembered: number, forgot = 0): DayActivity => ({
  day: d,
  remembered,
  forgot,
  xp: 0,
});

describe("longestStreak", () => {
  it("is null without days", () => {
    expect(longestStreak([])).toBeNull();
  });

  it("finds the longest run, across month ends and in any order", () => {
    expect(longestStreak(["2026-03-01", "2026-02-27", "2026-02-28", "2026-03-05", "2026-03-06"])).toEqual({
      length: 3,
      start: "2026-02-27",
      end: "2026-03-01",
    });
  });

  it("keeps the earlier run on a tie and ignores duplicates", () => {
    expect(longestStreak(["2026-01-01", "2026-01-01", "2026-01-02", "2026-01-10", "2026-01-11"])).toEqual({
      length: 2,
      start: "2026-01-01",
      end: "2026-01-02",
    });
  });
});

describe("activitySummary", () => {
  it("sums reviews, finds the best and perfect days", () => {
    const s = activitySummary([day("2026-01-01", 5), day("2026-01-02", 6, 2), day("2026-01-03", 0)]);
    expect(s).toMatchObject({
      reviews: 13,
      remembered: 11,
      forgot: 2,
      activeDays: 3,
      perfectDays: 1,
      avgReviewsPerActiveDay: 7,
      firstDay: "2026-01-01",
    });
    expect(s.accuracy).toBeCloseTo(11 / 13);
    expect(s.bestDay?.day).toBe("2026-01-02");
  });

  it("has no accuracy or best day without reviews", () => {
    const s = activitySummary([]);
    expect(s.accuracy).toBeNull();
    expect(s.bestDay).toBeNull();
    expect(s.firstDay).toBeNull();
  });
});

describe("lastNDays and accuracyTrend", () => {
  it("fills missing days with zeros, oldest first", () => {
    expect(lastNDays([day("2026-01-02", 3)], "2026-01-03", 3).map((d) => [d.day, d.remembered])).toEqual([
      ["2026-01-01", 0],
      ["2026-01-02", 3],
      ["2026-01-03", 0],
    ]);
  });

  it("compares the two windows", () => {
    const trend = accuracyTrend([day("2026-01-01", 1, 1), day("2026-01-03", 3, 1)], "2026-01-04", 2);
    expect(trend).toEqual({ previous: 0.5, current: 0.75 });
  });

  it("is null for a window without reviews", () => {
    expect(accuracyTrend([], "2026-01-04", 2)).toEqual({
      previous: null,
      current: null,
    });
  });
});

describe("weekdayTotals", () => {
  it("puts Monday first", () => {
    // 2026-11-16 is a Monday, 2026-11-22 a Sunday.
    const totals = weekdayTotals([day("2026-11-16", 2), day("2026-11-22", 1, 1)]);
    expect(totals[0]).toBe(2);
    expect(totals[6]).toBe(2);
  });
});

describe("heatmapWeeks", () => {
  it("ends with the week of today, Monday first, future days empty", () => {
    // 2026-11-18 is a Wednesday.
    const weeks = heatmapWeeks([day("2026-11-17", 4)], "2026-11-18", 2);
    expect(weeks).toHaveLength(2);
    expect(weeks[0][0]?.day).toBe("2026-11-09");
    expect(weeks[1][1]).toEqual({ day: "2026-11-17", reviews: 4 });
    expect(weeks[1][2]).toEqual({ day: "2026-11-18", reviews: 0 });
    expect(weeks[1][3]).toBeNull();
  });
});

describe("intensity", () => {
  it("maps to 0–4", () => {
    expect(intensity(0, 10)).toBe(0);
    expect(intensity(1, 10)).toBe(1);
    expect(intensity(5, 10)).toBe(2);
    expect(intensity(10, 10)).toBe(4);
  });
});

describe("shiftHours", () => {
  it("moves UTC counts into local hours", () => {
    const utc = Array(24).fill(0);
    utc[23] = 5;
    expect(shiftHours(utc, 120)[1]).toBe(5); // 23:00 UTC = 01:00 in UTC+2
    expect(shiftHours(utc, -300)[18]).toBe(5); // = 18:00 in UTC-5
  });
});

describe("peakIndex", () => {
  it("is -1 when everything is zero", () => {
    expect(peakIndex([0, 0])).toBe(-1);
    expect(peakIndex([1, 3, 3])).toBe(1);
  });
});
