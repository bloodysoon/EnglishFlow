import { describe, expect, it } from "vitest";

import { parseCardFilters, toggleFilterHref } from "./topics";

describe("card filters", () => {
  it("keeps only known topics and parts of speech", () => {
    expect(parseCardFilters({ topics: "sport,nope,travel", pos: ["verb", "x"] })).toEqual({
      topics: ["sport", "travel"],
      partsOfSpeech: ["verb"],
    });
    expect(parseCardFilters({})).toEqual({ topics: [], partsOfSpeech: [] });
  });

  it("toggles a value in the URL", () => {
    const filters = { topics: ["sport"], partsOfSpeech: [] };
    expect(toggleFilterHref(filters, "topics", "travel")).toBe("/learn?topics=sport,travel");
    expect(toggleFilterHref(filters, "topics", "sport")).toBe("/learn");
    expect(toggleFilterHref(filters, "partsOfSpeech", "verb")).toBe("/learn?topics=sport&pos=verb");
    expect(toggleFilterHref(filters, "topics", null)).toBe("/learn");
  });
});
