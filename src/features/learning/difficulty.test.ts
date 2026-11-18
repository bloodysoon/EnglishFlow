import { describe, expect, it } from "vitest";

import { wordDifficulty } from "./difficulty";

describe("wordDifficulty", () => {
  it("is 3 when the word is forgotten most of the time", () => {
    expect(wordDifficulty(3, 3)).toBe(3);
    expect(wordDifficulty(3, 5)).toBe(3);
  });

  it("is 3 after many lapses, even with many reviews", () => {
    expect(wordDifficulty(5, 20)).toBe(3);
  });

  it("is 2 for a middling share or count", () => {
    expect(wordDifficulty(2, 5)).toBe(2);
    expect(wordDifficulty(3, 10)).toBe(2);
  });

  it("is 1 when the word is mostly remembered", () => {
    expect(wordDifficulty(2, 10)).toBe(1);
  });

  it("does not divide by zero", () => {
    expect(wordDifficulty(0, 0)).toBe(1);
  });
});
