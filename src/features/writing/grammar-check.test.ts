import { describe, expect, it } from "vitest";

import { sentenceSchema, toGrammarIssues } from "./grammar-check";

describe("toGrammarIssues", () => {
  it("cuts the wrong fragment out of the sentence and keeps three suggestions", () => {
    const text = "She go to school.";
    const json = {
      matches: [
        {
          message: "The verb does not agree with the subject.",
          offset: 4,
          length: 2,
          replacements: [{ value: "goes" }, { value: "went" }, { value: "is going" }, { value: "has gone" }],
          rule: { id: "SVA" },
        },
      ],
    };

    expect(toGrammarIssues(text, json)).toEqual([
      { fragment: "go", message: "The verb does not agree with the subject.", suggestions: ["goes", "went", "is going"] },
    ]);
  });

  it("returns no issues for a correct sentence", () => {
    expect(toGrammarIssues("She goes to school.", { matches: [] })).toEqual([]);
  });

  it("throws on an unknown answer", () => {
    expect(() => toGrammarIssues("Hi.", { error: "down" })).toThrow();
  });
});

describe("sentenceSchema", () => {
  it("trims and rejects empty or too long sentences", () => {
    expect(sentenceSchema.parse("  Hi there.  ")).toBe("Hi there.");
    expect(sentenceSchema.safeParse("   ").success).toBe(false);
    expect(sentenceSchema.safeParse("a".repeat(301)).success).toBe(false);
  });
});
