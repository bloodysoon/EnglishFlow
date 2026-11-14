import { describe, expect, it } from "vitest";

import { plural } from "./plural";

describe("plural", () => {
  const ru = { one: "{n} слово", few: "{n} слова", many: "{n} слов", other: "{n} слова" };
  const ro = { one: "{n} cuvânt", few: "{n} cuvinte", other: "{n} de cuvinte" };

  it("picks the right form per language", () => {
    expect(plural("en", 1, { one: "{n} word", other: "{n} words" })).toBe("1 word");
    expect(plural("en", 3, { one: "{n} word", other: "{n} words" })).toBe("3 words");
    expect([1, 2, 5, 21].map((n) => plural("ru", n, ru))).toEqual(["1 слово", "2 слова", "5 слов", "21 слово"]);
    expect([1, 2, 20].map((n) => plural("ro", n, ro))).toEqual(["1 cuvânt", "2 cuvinte", "20 de cuvinte"]);
  });

  it("falls back to other when a form is missing", () => {
    expect(plural("ru", 5, { one: "{n} x", other: "{n} y" })).toBe("5 y");
  });
});
