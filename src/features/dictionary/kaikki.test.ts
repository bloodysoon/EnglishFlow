import { describe, expect, it } from "vitest";

import {
  chooseEntry,
  emptyWordDraft,
  extractWord,
  kaikkiUrl,
  normalizeTranslation,
  parseKaikkiJsonl,
} from "./kaikki";

// Trimmed-down shapes of real kaikki.org lines (borrow).
const verb = {
  word: "borrow",
  pos: "verb",
  sounds: [
    { ipa: "/ˈbɑɹ.oʊ/", tags: ["General-American"] },
    { ipa: "/ˈbɒɹəʊ/", tags: ["Received-Pronunciation", "UK"] },
  ],
  translations: [
    { code: "de", word: "leihen", sense: "receive temporarily" },
    { code: "ru", word: "занима́ть", sense: "receive temporarily", tags: ["imperfective"] },
    { code: "ru", word: "заня́ть", sense: "receive temporarily" },
    { code: "ru", word: "занима́ть", sense: "receive temporarily" },
    { code: "ru", word: "брать взаймы́", sense: "receive temporarily" },
    { code: "ru", word: "одолжи́ть", sense: "receive temporarily" },
    { code: "ru", word: "одалживать", sense: "receive temporarily" },
    { code: "ru", word: "заи́мствовать", sense: "adopt (an idea)" },
    { code: "ro", word: "împrumuta", sense: "receive temporarily" },
  ],
  senses: [
    {
      glosses: ["To receive (something) from somebody temporarily."],
      examples: [
        { text: "A very long literary quotation that should never be picked as an example.", type: "quotation" },
        { text: "Can I borrow your pen?", type: "example" },
      ],
    },
  ],
};

const noun = { word: "borrow", pos: "noun", senses: [{ glosses: ["A golf term."] }] };

const jsonl = [JSON.stringify(noun), JSON.stringify(verb), "not json", JSON.stringify({ pos: "noun" })].join("\n");

describe("parseKaikkiJsonl", () => {
  it("keeps valid entries and skips broken lines", () => {
    const entries = parseKaikkiJsonl(jsonl);
    expect(entries.map((e) => e.pos)).toEqual(["noun", "verb"]);
  });
});

describe("kaikkiUrl", () => {
  it("builds the per-word path", () => {
    expect(kaikkiUrl("Borrow")).toBe("https://kaikki.org/dictionary/English/meaning/b/bo/borrow.jsonl");
  });

  it("encodes characters that are unsafe in a path", () => {
    expect(kaikkiUrl("a/b")).toContain("a%2Fb.jsonl");
  });
});

describe("normalizeTranslation", () => {
  it("removes Russian stress marks", () => {
    expect(normalizeTranslation("брать взаймы́", "ru")).toBe("брать взаймы");
  });

  it("keeps ё and й intact", () => {
    expect(normalizeTranslation("ещё мой", "ru")).toBe("ещё мой");
  });

  it("writes Romanian ș and ț with a comma", () => {
    expect(normalizeTranslation("a şopti, ţară", "ro")).toBe("a șopti, țară");
  });
});

describe("chooseEntry", () => {
  const entries = parseKaikkiJsonl(jsonl);

  it("prefers the requested part of speech", () => {
    expect(chooseEntry(entries, "noun")?.pos).toBe("noun");
  });

  it("otherwise prefers an entry with RU/RO translations", () => {
    expect(chooseEntry(entries)?.pos).toBe("verb");
  });

  it("returns null when the part of speech is missing", () => {
    expect(chooseEntry(entries, "adj")).toBeNull();
  });
});

describe("extractWord", () => {
  const word = extractWord(parseKaikkiJsonl(jsonl), " Borrow ", "verb");

  it("takes the main meaning's first translation and its alternatives", () => {
    expect(word?.translations.ru).toEqual({
      translation: "занимать",
      alternatives: ["занять", "брать взаймы", "одолжить"],
      source: "wiktionary",
      reviewed: false,
    });
    expect(word?.translations.ro?.translation).toBe("împrumuta");
  });

  it("picks the UK pronunciation, a short example and the first gloss", () => {
    expect(word).toMatchObject({
      lemma: "borrow",
      pos: "verb",
      source: "wiktionary",
      ipa: "/ˈbɒɹəʊ/",
      example: "Can I borrow your pen?",
      definition: "To receive (something) from somebody temporarily.",
    });
  });

  it("leaves a language empty when Wiktionary has no translation", () => {
    const nounOnly = extractWord(parseKaikkiJsonl(JSON.stringify(noun)), "borrow");
    expect(nounOnly?.translations).toEqual({ ru: null, ro: null, id: null });
    expect(nounOnly?.example).toBeNull();
  });

  it("returns null with no entries", () => {
    expect(extractWord([], "borrow")).toBeNull();
  });
});

describe("emptyWordDraft", () => {
  it("is a manual draft with every gap open", () => {
    expect(emptyWordDraft("Afford", "verb")).toEqual({
      lemma: "afford",
      pos: "verb",
      source: "manual",
      level: null,
      levelSource: null,
      ipa: null,
      definition: null,
      example: null,
      translations: { ru: null, ro: null, id: null },
    });
  });
});
