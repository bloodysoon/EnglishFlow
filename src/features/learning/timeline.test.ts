import { describe, expect, it } from "vitest";

import { wordTimeline } from "./timeline";

const at = (day: number) => `2026-11-${String(day).padStart(2, "0")}T10:00:00Z`;

describe("wordTimeline", () => {
  it("replays the boxes: remembered moves up, forgot goes back to box 1", () => {
    const steps = wordTimeline(at(1), [
      { reason: "review_remembered", amount: 10, at: at(2) },
      { reason: "review_remembered", amount: 10, at: at(5) },
      { reason: "review_forgot", amount: 0, at: at(12) },
    ]);
    expect(steps.map((s) => [s.kind, s.from, s.to])).toEqual([
      ["added", undefined, undefined],
      ["remembered", 1, 2],
      ["remembered", 2, 3],
      ["forgot", 3, 1],
    ]);
  });

  it("sorts by time, stops at the last box and ignores unknown reasons", () => {
    const remembered = [6, 5, 4, 3, 2].map((day) => ({ reason: "review_remembered", amount: 10, at: at(day) }));
    const steps = wordTimeline(at(1), [...remembered, { reason: "something_new", amount: 1, at: at(7) }]);
    expect(steps).toHaveLength(6);
    expect(steps.at(-1)).toMatchObject({ from: 5, to: 5, at: at(6) });
  });

  it("starts again at box 1 when the word was added after older reviews", () => {
    const steps = wordTimeline(at(10), [
      { reason: "review_remembered", amount: 10, at: at(2) },
      { reason: "review_remembered", amount: 10, at: at(11) },
    ]);
    expect(steps.map((s) => s.to)).toEqual([2, undefined, 2]);
  });
});
