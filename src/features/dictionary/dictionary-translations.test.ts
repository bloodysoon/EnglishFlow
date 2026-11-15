import { describe, expect, it } from "vitest";

import { buildTranslationsCsv, parseTranslationsCsv, splitTranslationCell } from "./dictionary-translations";

describe("translations.csv", () => {
  const entries = [
    { lemma: "pool", partsOfSpeech: ["noun", "verb"], level: "A2" },
    { lemma: "o'clock", partsOfSpeech: ["adv"], level: "A1" },
  ];

  it("keeps filled translations when the file is rebuilt", () => {
    const filled = parseTranslationsCsv(
      'lemma,parts_of_speech,level,ru,ro\npool,noun|verb,A2,бассейн; пруд,"piscină, bazin"\n',
    );
    expect(filled.get("pool")).toEqual({ ru: "бассейн; пруд", ro: "piscină, bazin" });
    const csv = buildTranslationsCsv(entries, filled);
    expect(csv).toBe(
      'lemma,parts_of_speech,level,ru,ro,definition_ru,definition_ro\npool,noun|verb,A2,бассейн; пруд,"piscină, bazin",,\no\'clock,adv,A1,,,,\n',
    );
    expect(parseTranslationsCsv(csv)).toEqual(filled);
  });

  it("reads and keeps the optional definition columns", () => {
    const filled = parseTranslationsCsv(
      'lemma,parts_of_speech,level,ru,ro,definition_ru,definition_ro\npool,noun,A2,,,"Место, где плавают.",\n',
    );
    expect(filled.get("pool")).toEqual({ ru: "", ro: "", definitionRu: "Место, где плавают." });
    expect(parseTranslationsCsv(buildTranslationsCsv(entries, filled))).toEqual(filled);
  });

  it("splits a cell into the main translation and alternatives", () => {
    expect(splitTranslationCell(" бассейн ; пруд;; бассейн ")).toEqual({
      translation: "бассейн",
      alternatives: ["пруд"],
    });
    expect(splitTranslationCell("  ")).toBeNull();
    expect(splitTranslationCell(null)).toBeNull();
  });
});
