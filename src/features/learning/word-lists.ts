import type { SupabaseClient } from "@supabase/supabase-js";

import type { CefrLevel } from "@/features/dictionary/cefr";

type Row = Record<string, unknown>;

const firstTranslation = (word: Row) => {
  const t = ((word.word_translations as Row[] | null) ?? [])[0];
  return {
    translation: t ? String(t.translation) : null,
    alternatives: t ? ((t.alternatives as string[] | null) ?? []) : [],
  };
};

// ---------------------------------------------------------------------
// My words
// ---------------------------------------------------------------------

export type MyWord = {
  id: string;
  lemma: string;
  partOfSpeech: string;
  level: CefrLevel | null;
  translation: string | null;
  box: number;
  dueOn: string | null; // null = waiting in the queue
  custom: boolean;
};

export const MY_WORDS_LIMIT = 500;

// Words I am learning, or (known = true) the ones I marked as known.
export async function getMyWords(
  supabase: SupabaseClient,
  userId: string,
  language: "ru" | "ro",
  known = false,
): Promise<MyWord[]> {
  const { data, error } = await supabase
    .from("user_words")
    .select("word_id, box, due_on, added_at, words(id, lemma, part_of_speech, cefr_level, owner_id, source, word_translations(language, translation))")
    .eq("user_id", userId)
    .eq("known", known)
    .eq("words.word_translations.language", language)
    .order("added_at", { ascending: false })
    .limit(MY_WORDS_LIMIT);

  if (error) throw error;

  return ((data as Row[] | null) ?? [])
    .filter((row) => row.words)
    .map((row) => {
      const w = row.words as Row;
      return {
        id: String(w.id),
        lemma: String(w.lemma),
        partOfSpeech: String(w.part_of_speech ?? ""),
        level: (w.cefr_level as CefrLevel | null) ?? null,
        translation: firstTranslation(w).translation,
        box: Number(row.box),
        dueOn: (row.due_on as string | null) ?? null,
        // Typed by the learner (dictionary words they sorted are owned too, but from Wiktionary).
        custom: w.owner_id !== null && w.owner_id !== undefined && w.source === "manual",
      };
    });
}
