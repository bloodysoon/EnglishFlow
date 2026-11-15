import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { CUSTOM_WORD_PARTS_OF_SPEECH, LEMMA_PATTERN, customWordSchema, lemmaSchema } from "./custom-word";

const valid = { lemma: "Look  Up ", partOfSpeech: "verb", language: "ro", translation: "a căuta", alternatives: [] };

describe("lemmaSchema", () => {
  it.each([
    ["borrow", "borrow"],
    ["  Look  Up ", "look up"],
    ["well-known", "well-known"],
    ["o'clock", "o'clock"],
  ])("accepts %j as %j", (input, expected) => {
    expect(lemmaSchema.parse(input)).toBe(expected);
  });

  it.each(["", "   ", "привет", "a1", "-start", "end-", "x".repeat(61), "<script>", "drop'--"])("rejects %j", (input) => {
    expect(lemmaSchema.safeParse(input).success).toBe(false);
  });
});

describe("customWordSchema", () => {
  it("normalizes and accepts a valid word", () => {
    expect(customWordSchema.parse(valid)).toMatchObject({ lemma: "look up", translation: "a căuta" });
  });

  it("rejects unknown languages, parts of speech and oversized fields", () => {
    expect(customWordSchema.safeParse({ ...valid, language: "en" }).success).toBe(false);
    expect(customWordSchema.safeParse({ ...valid, partOfSpeech: "gerund" }).success).toBe(false);
    expect(customWordSchema.safeParse({ ...valid, translation: " " }).success).toBe(false);
    expect(customWordSchema.safeParse({ ...valid, alternatives: ["a", "b", "c", "d", "e", "f"] }).success).toBe(false);
    expect(customWordSchema.safeParse({ ...valid, example: "x".repeat(301) }).success).toBe(false);
  });
});

describe("add_custom_word in SQL matches these rules", () => {
  const sql = readFileSync(path.join(process.cwd(), "supabase/migrations/20261114190000_dictionary_pool.sql"), "utf8");

  it("allows the same parts of speech", () => {
    const list = sql.match(/v_pos not in \(([^)]*)\)/)?.[1] ?? "";
    const sqlValues = [...list.matchAll(/'([^']*)'/g)].map((m) => m[1]);
    expect(sqlValues).toEqual([...CUSTOM_WORD_PARTS_OF_SPEECH]);
  });

  it("uses the same word pattern and length", () => {
    expect(sql).toContain(`v_lemma !~ '${LEMMA_PATTERN.source.replace("'", "''")}'`);
    expect(sql).toContain("char_length(v_lemma) not between 1 and 60");
    expect(sql).toContain("if v_today_count >= v_custom_limit then");
  });
});
