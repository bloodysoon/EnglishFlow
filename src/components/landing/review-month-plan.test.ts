import { describe, expect, it } from "vitest";

import { CALENDAR_DAYS, PLAN_DAYS, SAMPLE, boxOn, planMonth } from "./review-month-plan";

describe("planMonth", () => {
  it("brings a remembered word back after each box's interval", () => {
    const days = planMonth([{ word: "eager", start: 1 }], 30).map((e) => [e.day, e.box, e.next]);
    // Box 2 every 3 days, Box 3 every week, Box 4 every 2 weeks.
    expect(days).toEqual([
      [1, 1, 2],
      [4, 2, 3],
      [11, 3, 4],
      [25, 4, 5],
    ]);
  });

  it("sends a forgotten word back to Box 1, due the next day", () => {
    const events = planMonth([{ word: "borrow", start: 2, forget: [1] }]);
    expect(events[1]).toMatchObject({ day: 5, box: 2, remembered: false, next: 1 });
    expect(events[2]).toMatchObject({ day: 6, box: 1, next: 2 });
  });

  it("keeps every review inside the stretch, in day order", () => {
    const events = planMonth([
      { word: "a", start: 1 },
      { word: "b", start: 4 },
    ]);
    expect(events.every((e) => e.day <= 8)).toBe(true);
    expect(events.map((e) => e.day)).toEqual([...events.map((e) => e.day)].sort((x, y) => x - y));
  });
});

// The landing demo must keep teaching the whole rule, even in its shorter form.
describe("the landing sample", () => {
  const played = planMonth(SAMPLE, PLAN_DAYS);
  const schedule = planMonth(SAMPLE, CALENDAR_DAYS);

  it("shows remembered reviews and a forgotten word going back to Box 1", () => {
    expect(played.some((e) => e.remembered)).toBe(true);
    expect(played.some((e) => !e.remembered && e.next === 1)).toBe(true);
  });

  it("has rest days with nothing due", () => {
    const busy = new Set(played.map((e) => e.day));
    expect(Array.from({ length: PLAN_DAYS }, (_, i) => i + 1).some((d) => !busy.has(d))).toBe(true);
  });

  it("fits every word's next scheduled review in the calendar", () => {
    for (const { word } of SAMPLE) {
      expect(schedule.some((e) => e.word === word && e.day > PLAN_DAYS), word).toBe(true);
    }
  });
});

describe("boxOn", () => {
  const events = planMonth([{ word: "eager", start: 1 }], 30);

  it("is Box 1 before the first review", () => {
    expect(boxOn(events, "eager", 0)).toBe(1);
  });

  it("follows the latest review up to that day", () => {
    expect(boxOn(events, "eager", 3)).toBe(2);
    expect(boxOn(events, "eager", 11)).toBe(4);
  });
});
