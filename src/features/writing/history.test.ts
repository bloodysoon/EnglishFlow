import { describe, expect, it } from "vitest";

import { masteredTenses, type PracticeEntry } from "./history";

const entry = (over: Partial<PracticeEntry>): PracticeEntry => ({
  id: 1,
  sentence: "x",
  tense: null,
  tenseOk: null,
  issues: [],
  at: "2026-11-19T00:00:00Z",
  ...over,
});

describe("masteredTenses", () => {
  it("counts only clean sentences in the right tense", () => {
    const issue = { fragment: "a", message: "b", suggestions: [] };
    expect(
      masteredTenses([
        entry({ tense: "past-simple", tenseOk: true }),
        entry({ tense: "past-simple", tenseOk: true }),
        entry({ tense: "future-simple", tenseOk: false }),
        entry({ tense: "present-perfect", tenseOk: true, issues: [issue] }),
        entry({}),
      ]),
    ).toEqual(new Set(["past-simple"]));
  });
});
