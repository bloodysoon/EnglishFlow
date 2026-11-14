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
// One published set, word by word, for picking
// ---------------------------------------------------------------------

export type SetWord = {
  id: string;
  lemma: string;
  partOfSpeech: string;
  ipa: string | null;
  level: CefrLevel | null;
  translation: string | null;
  alternatives: string[];
  inMyWords: boolean;
};

export type LearnerSet = {
  slug: string;
  title: Record<string, string>;
  description: Record<string, string> | null;
  level: string | null;
  words: SetWord[];
};

export async function getSetForLearner(
  supabase: SupabaseClient,
  userId: string,
  slug: string,
  language: "ru" | "ro",
): Promise<LearnerSet | null> {
  const { data, error } = await supabase
    .from("word_sets")
    .select(
      "slug, title, description, level, word_set_items(position, words(id, lemma, part_of_speech, ipa, cefr_level, word_translations(language, translation, alternatives)))",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("word_set_items.words.word_translations.language", language)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const items = ((data.word_set_items as Row[] | null) ?? [])
    .filter((item) => item.words)
    .sort((a, b) => Number(a.position) - Number(b.position));

  const ids = items.map((item) => String((item.words as Row).id));
  const { data: mine, error: mineError } = ids.length
    ? await supabase.from("user_words").select("word_id").eq("user_id", userId).in("word_id", ids)
    : { data: [], error: null };
  if (mineError) throw mineError;
  const myIds = new Set(((mine as Row[] | null) ?? []).map((r) => String(r.word_id)));

  return {
    slug: String(data.slug),
    title: (data.title as Record<string, string>) ?? { en: slug },
    description: (data.description as Record<string, string> | null) ?? null,
    level: (data.level as string | null) ?? null,
    words: items.map((item) => {
      const w = item.words as Row;
      return {
        id: String(w.id),
        lemma: String(w.lemma),
        partOfSpeech: String(w.part_of_speech ?? ""),
        ipa: (w.ipa as string | null) ?? null,
        level: (w.cefr_level as CefrLevel | null) ?? null,
        ...firstTranslation(w),
        inMyWords: myIds.has(String(w.id)),
      };
    }),
  };
}

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

export async function getMyWords(supabase: SupabaseClient, userId: string, language: "ru" | "ro"): Promise<MyWord[]> {
  const { data, error } = await supabase
    .from("user_words")
    .select("word_id, box, due_on, added_at, words(id, lemma, part_of_speech, cefr_level, owner_id, word_translations(language, translation))")
    .eq("user_id", userId)
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
        custom: w.owner_id !== null && w.owner_id !== undefined,
      };
    });
}
