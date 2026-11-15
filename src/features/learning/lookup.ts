import type { SupabaseClient } from "@supabase/supabase-js";

import type { CefrLevel } from "@/features/dictionary/cefr";
import { extractWord, kaikkiUrl, parseKaikkiJsonl, type WordDraft } from "@/features/dictionary/kaikki";
import { logSupabaseError } from "@/lib/supabase/log-error";

type Row = Record<string, unknown>;

export type DictionaryMatch = {
  id: string;
  partOfSpeech: string;
  level: CefrLevel | null;
  translation: string | null;
  alternatives: string[];
  inMyWords: boolean;
};

export type WordLookup =
  // Already in our checked dictionary (a published set).
  | { kind: "dictionary"; lemma: string; matches: DictionaryMatch[] }
  // Not ours, but Wiktionary knows it: a draft for the learner to check.
  | {
      kind: "suggestion";
      lemma: string;
      partOfSpeech: string;
      ipa: string | null;
      example: string | null;
      translation: string | null;
      alternatives: string[];
    }
  | { kind: "not_found"; lemma: string };

async function findInDictionary(
  supabase: SupabaseClient,
  userId: string,
  lemma: string,
  language: "ru" | "ro",
): Promise<DictionaryMatch[]> {
  // RLS only returns shared words that sit in a published set.
  const { data, error } = await supabase
    .from("words")
    .select("id, part_of_speech, cefr_level, word_translations(language, translation, alternatives)")
    .eq("lemma", lemma)
    .is("owner_id", null)
    .eq("word_translations.language", language);

  if (error) {
    logSupabaseError("[Learn] Dictionary lookup failed", error);
    return [];
  }

  const words = (data as Row[] | null) ?? [];
  if (words.length === 0) return [];

  const { data: mine } = await supabase
    .from("user_words")
    .select("word_id")
    .eq("user_id", userId)
    .in(
      "word_id",
      words.map((w) => String(w.id)),
    );
  const myIds = new Set(((mine as Row[] | null) ?? []).map((r) => String(r.word_id)));

  return words.map((w) => {
    const t = ((w.word_translations as Row[] | null) ?? [])[0];
    return {
      id: String(w.id),
      partOfSpeech: String(w.part_of_speech ?? ""),
      level: (w.cefr_level as CefrLevel | null) ?? null,
      translation: t ? String(t.translation) : null,
      alternatives: t ? ((t.alternatives as string[] | null) ?? []) : [],
      inMyWords: myIds.has(String(w.id)),
    };
  });
}

// Wiktionary via kaikki.org; one small file per word, cached for a week.
// Null when Wiktionary has no entry, or on network trouble or timeout.
export async function fetchWiktionaryDraft(lemma: string, pos?: string): Promise<WordDraft | null> {
  try {
    const response = await fetch(kaikkiUrl(lemma), {
      headers: { "User-Agent": "elevo-word-lookup/1.0" },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) return null;
    return extractWord(parseKaikkiJsonl(await response.text()), lemma, pos || undefined);
  } catch {
    return null;
  }
}

async function suggestFromWiktionary(lemma: string, language: "ru" | "ro"): Promise<WordLookup> {
  const draft = await fetchWiktionaryDraft(lemma);
  if (!draft) return { kind: "not_found", lemma };

  const translation = draft.translations[language];
  return {
    kind: "suggestion",
    lemma,
    partOfSpeech: draft.pos,
    ipa: draft.ipa,
    example: draft.example,
    translation: translation?.translation ?? null,
    alternatives: translation?.alternatives ?? [],
  };
}

export async function lookupWord(
  supabase: SupabaseClient,
  userId: string,
  lemma: string,
  language: "ru" | "ro",
): Promise<WordLookup> {
  const matches = await findInDictionary(supabase, userId, lemma, language);
  if (matches.length > 0) return { kind: "dictionary", lemma, matches };
  return suggestFromWiktionary(lemma, language);
}
