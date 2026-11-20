import { z } from "zod";

// Mirrors the checks in public.add_custom_word
// (supabase/migrations/20261114160000_custom_words.sql); a test keeps the
// two in sync.

export const CUSTOM_WORD_PARTS_OF_SPEECH = [
  "",
  "noun",
  "verb",
  "adj",
  "adv",
  "prep",
  "conj",
  "pron",
  "det",
  "intj",
  "num",
  "phrase",
] as const;

// English letters, single spaces, hyphens or apostrophes between them:
// "borrow", "look up", "well-known", "o'clock".
export const LEMMA_PATTERN = /^[a-z]+([ '-][a-z]+)*$/;

export function normalizeLemma(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export const lemmaSchema = z
  .string()
  .transform(normalizeLemma)
  .pipe(z.string().min(1).max(60).regex(LEMMA_PATTERN, "english_letters_only"));

export const customWordSchema = z.object({
  lemma: lemmaSchema,
  partOfSpeech: z.enum(CUSTOM_WORD_PARTS_OF_SPEECH),
  language: z.enum(["ru", "ro", "id"]),
  translation: z.string().trim().min(1).max(200),
  alternatives: z.array(z.string().trim().min(1).max(200)).max(5),
  example: z.string().trim().max(300).optional(),
  ipa: z.string().trim().max(100).optional(),
});

export type CustomWordInput = z.infer<typeof customWordSchema>;
