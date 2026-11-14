import { z } from "zod";

import type { CefrLevel, LevelSource } from "./cefr.ts";

// Turns kaikki.org (Wiktionary) entries for one English word into the
// fields we store. Pure: fetching and caching live in scripts/word-sets.ts.
//
// Kaikki data is untrusted input, so it goes through Zod. The schemas
// only describe the fields we read; everything else is ignored.

export const DICTIONARY_LANGUAGES = ["ru", "ro"] as const;
export type DictionaryLanguage = (typeof DICTIONARY_LANGUAGES)[number];

const MAX_ALTERNATIVES = 3;
const MAX_EXAMPLE_LENGTH = 140;

const translationSchema = z.object({
  code: z.string().optional(),
  word: z.string().optional(),
  sense: z.string().optional(),
});

const entrySchema = z.object({
  word: z.string(),
  pos: z.string().default(""),
  sounds: z.array(z.object({ ipa: z.string().optional(), tags: z.array(z.string()).optional() })).default([]),
  translations: z.array(translationSchema).default([]),
  senses: z
    .array(
      z.object({
        glosses: z.array(z.string()).optional(),
        examples: z.array(z.object({ text: z.string().optional(), type: z.string().optional() })).optional(),
        translations: z.array(translationSchema).optional(),
      }),
    )
    .default([]),
});

export type KaikkiEntry = z.infer<typeof entrySchema>;

export type WordTranslationDraft = {
  translation: string;
  alternatives: string[];
  example?: string | null;
  source: "wiktionary" | "manual" | "machine";
  reviewed: boolean;
};

// One word as the review file stores it. A null translation is a gap to
// fill by hand before publishing.
export type WordDraft = {
  lemma: string;
  pos: string;
  source: "wiktionary" | "manual";
  // CEFR level and where it came from; set by the import from the word
  // lists (cefr.ts), or by hand.
  level: CefrLevel | null;
  levelSource: LevelSource | null;
  ipa: string | null;
  definition: string | null;
  example: string | null;
  translations: Record<DictionaryLanguage, WordTranslationDraft | null>;
};

// Parses a .jsonl file body; lines that are not valid entries are skipped.
export function parseKaikkiJsonl(body: string): KaikkiEntry[] {
  return body
    .split("\n")
    .filter((line) => line.trim() !== "")
    .flatMap((line) => {
      try {
        const parsed = entrySchema.safeParse(JSON.parse(line));
        return parsed.success ? [parsed.data] : [];
      } catch {
        return [];
      }
    });
}

// Kaikki stores one file per word: /meaning/b/bo/borrow.jsonl
export function kaikkiUrl(word: string): string {
  const w = word.trim().toLowerCase();
  return `https://kaikki.org/dictionary/English/meaning/${encodeURIComponent(w.slice(0, 1))}/${encodeURIComponent(w.slice(0, 2))}/${encodeURIComponent(w)}.jsonl`;
}

// Wiktionary marks Russian stress with combining accents (занима́ть) and
// sometimes writes Romanian ş/ţ with a cedilla; learners need neither.
export function normalizeTranslation(text: string, language: DictionaryLanguage): string {
  let result = text.normalize("NFD").replace(/[̀́]/g, "").normalize("NFC");
  if (language === "ro") {
    result = result
      .replace(/ş/g, "ș")
      .replace(/Ş/g, "Ș")
      .replace(/ţ/g, "ț")
      .replace(/Ţ/g, "Ț");
  }
  return result.replace(/\s+/g, " ").trim();
}

function allTranslations(entry: KaikkiEntry) {
  return [...entry.translations, ...entry.senses.flatMap((s) => s.translations ?? [])];
}

// The first sense that has translations for this language is the main
// meaning: its first word is the translation, the rest are alternatives.
export function pickTranslation(entry: KaikkiEntry, language: DictionaryLanguage): WordTranslationDraft | null {
  const matching = allTranslations(entry).filter((t) => t.code === language && t.word);
  if (matching.length === 0) return null;

  const mainSense = matching[0].sense;
  const words = matching
    .filter((t) => t.sense === mainSense)
    .map((t) => normalizeTranslation(t.word!, language))
    .filter((w, i, all) => w !== "" && all.indexOf(w) === i);

  if (words.length === 0) return null;

  return {
    translation: words[0],
    alternatives: words.slice(1, 1 + MAX_ALTERNATIVES),
    source: "wiktionary",
    reviewed: false,
  };
}

// British pronunciation first (the course teaches UK spelling), then
// General American, then whatever comes first.
export function pickIpa(entry: KaikkiEntry): string | null {
  const withIpa = entry.sounds.filter((s) => s.ipa);
  const prefer = (tag: string) => withIpa.find((s) => s.tags?.includes(tag))?.ipa;
  return prefer("Received-Pronunciation") ?? prefer("UK") ?? prefer("General-American") ?? withIpa[0]?.ipa ?? null;
}

// Short made-up usage examples only; long literary quotations are skipped.
export function pickExample(entry: KaikkiEntry): string | null {
  for (const sense of entry.senses) {
    for (const example of sense.examples ?? []) {
      const text = example.text?.replace(/\s+/g, " ").trim();
      if (example.type === "example" && text && text.length <= MAX_EXAMPLE_LENGTH) return text;
    }
  }
  return null;
}

export function pickDefinition(entry: KaikkiEntry): string | null {
  const gloss = entry.senses.find((s) => s.glosses?.[0])?.glosses?.[0];
  return gloss ? gloss.slice(0, 500) : null;
}

// Chooses the entry for a word: the requested part of speech, otherwise
// the first entry that has any RU/RO translation, otherwise the first.
export function chooseEntry(entries: KaikkiEntry[], pos?: string): KaikkiEntry | null {
  const candidates = pos ? entries.filter((e) => e.pos === pos) : entries;
  const hasTranslation = (e: KaikkiEntry) =>
    allTranslations(e).some((t) => DICTIONARY_LANGUAGES.some((l) => l === t.code));
  return candidates.find(hasTranslation) ?? candidates[0] ?? null;
}

// A blank draft for a word Wiktionary does not have: filled in by hand.
export function emptyWordDraft(lemma: string, pos = ""): WordDraft {
  return {
    lemma: lemma.trim().toLowerCase(),
    pos,
    source: "manual",
    level: null,
    levelSource: null,
    ipa: null,
    definition: null,
    example: null,
    translations: { ru: null, ro: null },
  };
}

export function extractWord(entries: KaikkiEntry[], lemma: string, pos?: string): WordDraft | null {
  const entry = chooseEntry(entries, pos);
  if (!entry) return null;

  return {
    lemma: lemma.trim().toLowerCase(),
    pos: entry.pos,
    source: "wiktionary",
    level: null,
    levelSource: null,
    ipa: pickIpa(entry),
    definition: pickDefinition(entry),
    example: pickExample(entry),
    translations: {
      ru: pickTranslation(entry, "ru"),
      ro: pickTranslation(entry, "ro"),
    },
  };
}
