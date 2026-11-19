import { describe, expect, it } from "vitest";

import { masteredTenses, tenseCoverage, type PracticeEntry } from "./history";

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

describe("tenseCoverage", () => {
  it("counts distinct tenses overall and the most on one word", () => {
    expect(
      tenseCoverage([
        { word_id: "a", tense: "past-simple" },
        { word_id: "a", tense: "past-simple" },
        { word_id: "a", tense: "future-simple" },
        { word_id: "b", tense: "present-simple" },
        { word_id: "b", tense: null },
      ]),
    ).toEqual({ tensesUsed: 3, wordTenses: 2 });
  });

  it("is zero without sentences", () => {
    expect(tenseCoverage([])).toEqual({ tensesUsed: 0, wordTenses: 0 });
  });
});
