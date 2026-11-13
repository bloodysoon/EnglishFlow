import { describe, expect, it } from "vitest";
import { LEITNER_BOXES, formatReviewInterval } from "./boxes";

describe("LEITNER_BOXES", () => {
  it("has five boxes numbered 1 to 5", () => {
    expect(LEITNER_BOXES.map((b) => b.box)).toEqual([1, 2, 3, 4, 5]);
  });

  it("uses the promised 1 / 3 / 7 / 14 / 30 day schedule", () => {
    expect(LEITNER_BOXES.map((b) => b.intervalDays)).toEqual([1, 3, 7, 14, 30]);
  });
});

describe("formatReviewInterval", () => {
  it.each([
    [1, "every day"],
    [3, "every 3 days"],
    [7, "every week"],
    [14, "every 2 weeks"],
    [30, "every month"],
  ])("formats %i days as %s", (days, expected) => {
    expect(formatReviewInterval(days)).toBe(expected);
  });

  it("rejects zero, negative and fractional intervals", () => {
    expect(() => formatReviewInterval(0)).toThrow(RangeError);
    expect(() => formatReviewInterval(-1)).toThrow(RangeError);
    expect(() => formatReviewInterval(1.5)).toThrow(RangeError);
  });
});
