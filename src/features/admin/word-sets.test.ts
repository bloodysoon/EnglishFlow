import { describe, expect, it } from "vitest";

import { summarizeWordSet, type AdminWord } from "./word-sets";

const word = (overrides: Partial<AdminWord>): AdminWord => ({
  id: "id",
  lemma: "borrow",
  partOfSpeech: "verb",
  ipa: null,
  example: null,
  level: "A1",
  levelSource: "cefr-j",
  translations: {},
  ...overrides,
});

const t = (language: "ru" | "ro" | "id", reviewed: boolean) => ({
  language,
  translation: "x",
  alternatives: [],
  reviewed,
  source: "wiktionary",
});

describe("summarizeWordSet", () => {
  it("counts reviewed and missing translations and missing levels", () => {
    expect(
      summarizeWordSet([
        word({ translations: { ru: t("ru", true), ro: t("ro", false) } }),
        word({ level: null, translations: { ru: t("ru", true) } }),
        word({ translations: {} }),
      ]),
    ).toEqual({ words: 3, reviewed: { ru: 2, ro: 0, id: 0 }, missingTranslations: 6, missingLevels: 1 });
  });

  it("handles an empty set", () => {
    expect(summarizeWordSet([])).toEqual({ words: 0, reviewed: { ru: 0, ro: 0, id: 0 }, missingTranslations: 0, missingLevels: 0 });
  });
});
