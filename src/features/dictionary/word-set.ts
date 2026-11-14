import { z } from "zod";

import { CEFR_LEVELS, LEVEL_SOURCES } from "./cefr.ts";
import { DICTIONARY_LANGUAGES, type WordDraft } from "./kaikki.ts";

// Two files per word set, both in content/word-sets/:
//   <slug>.json        – what the team writes: title, level, the word list
//   <slug>.words.json  – generated from Wiktionary, then reviewed by hand
// Limits mirror the database constraints, so a seed never fails half-way.

const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, digits and dashes");

const localizedSchema = z.object({
  en: z.string().min(1).max(120),
  ru: z.string().min(1).max(120).optional(),
  ro: z.string().min(1).max(120).optional(),
});

export const wordSetDefinitionSchema = z.object({
  slug: slugSchema,
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  published: z.boolean().default(false),
  title: localizedSchema,
  description: localizedSchema.optional(),
  words: z
    .array(
      z.union([
        z.string().trim().min(1).max(100),
        z.object({
          word: z.string().trim().min(1).max(100),
          pos: z.string().max(30).optional(),
          // Overrides the level from the word lists.
          level: z.enum(CEFR_LEVELS).optional(),
        }),
      ]),
    )
    .min(1),
});

export type WordSetDefinition = z.infer<typeof wordSetDefinitionSchema>;

const translationDraftSchema = z.object({
  translation: z.string().trim().min(1).max(200),
  alternatives: z.array(z.string().trim().min(1).max(200)).max(5).default([]),
  example: z.string().trim().min(1).max(300).nullable().optional(),
  source: z.enum(["wiktionary", "manual", "machine"]),
  reviewed: z.boolean(),
});

export const wordDraftSchema = z.object({
  lemma: z.string().trim().min(1).max(100),
  pos: z.string().max(30),
  source: z.enum(["wiktionary", "manual"]).default("wiktionary"),
  // Older files have no level yet.
  level: z.enum(CEFR_LEVELS).nullable().default(null),
  levelSource: z.enum(LEVEL_SOURCES).nullable().default(null),
  ipa: z.string().max(100).nullable(),
  definition: z.string().max(500).nullable(),
  example: z.string().max(300).nullable(),
  translations: z.object(
    Object.fromEntries(DICTIONARY_LANGUAGES.map((l) => [l, translationDraftSchema.nullable()])) as Record<
      (typeof DICTIONARY_LANGUAGES)[number],
      z.ZodNullable<typeof translationDraftSchema>
    >,
  ),
});

export const wordsFileSchema = z.array(wordDraftSchema);

export type WordsFile = z.infer<typeof wordsFileSchema>;

// "borrow" or { word: "borrow", pos: "verb" } → { word, pos? }
export function normalizeSetWord(item: WordSetDefinition["words"][number]): {
  word: string;
  pos?: string;
  level?: (typeof CEFR_LEVELS)[number];
} {
  return typeof item === "string"
    ? { word: item.trim().toLowerCase() }
    : { word: item.word.trim().toLowerCase(), pos: item.pos, level: item.level };
}

export const slugArgumentSchema = slugSchema;

// Re-fetching only fills gaps: anything already in the reviewed file
// (edited fields, translations, reviewed flags) wins over fresh data.
export function mergeWordDraft(fresh: WordDraft, existing: WordDraft | undefined): WordDraft {
  if (!existing) return fresh;

  return {
    ...existing,
    level: existing.level ?? fresh.level,
    levelSource: existing.level ? existing.levelSource : fresh.levelSource,
    ipa: existing.ipa ?? fresh.ipa,
    definition: existing.definition ?? fresh.definition,
    example: existing.example ?? fresh.example,
    translations: Object.fromEntries(
      DICTIONARY_LANGUAGES.map((l) => [l, existing.translations[l] ?? fresh.translations[l]]),
    ) as WordDraft["translations"],
  };
}
