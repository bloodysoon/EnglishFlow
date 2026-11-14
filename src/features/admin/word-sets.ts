import type { SupabaseClient } from "@supabase/supabase-js";

import type { CefrLevel, LevelSource } from "@/features/dictionary/cefr";
import type { DictionaryLanguage } from "@/features/dictionary/kaikki";

export type AdminTranslation = {
  language: DictionaryLanguage;
  translation: string;
  alternatives: string[];
  reviewed: boolean;
  source: string;
};

export type AdminWord = {
  id: string;
  lemma: string;
  partOfSpeech: string;
  ipa: string | null;
  example: string | null;
  level: CefrLevel | null;
  levelSource: LevelSource | null;
  translations: Partial<Record<DictionaryLanguage, AdminTranslation>>;
};

export type AdminWordSet = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  published: boolean;
  words: AdminWord[];
};

export type WordSetSummary = {
  words: number;
  // Translations that learners can see (reviewed), per language.
  reviewed: Record<DictionaryLanguage, number>;
  missingTranslations: number;
  missingLevels: number;
};

// What still needs work before a set is ready to publish.
export function summarizeWordSet(words: AdminWord[]): WordSetSummary {
  const reviewed = { ru: 0, ro: 0 };
  let missingTranslations = 0;
  let missingLevels = 0;

  for (const word of words) {
    if (!word.level) missingLevels++;
    for (const language of ["ru", "ro"] as const) {
      const t = word.translations[language];
      if (!t) missingTranslations++;
      else if (t.reviewed) reviewed[language]++;
    }
  }

  return { words: words.length, reviewed, missingTranslations, missingLevels };
}

const SET_SELECT = `id, slug, title, level, is_published,
  word_set_items(position, words(id, lemma, part_of_speech, ipa, example, cefr_level, level_source,
    word_translations(language, translation, alternatives, reviewed, source)))`;

type Row = Record<string, unknown>;

function toWordSet(row: Row): AdminWordSet {
  const items = ((row.word_set_items as Row[] | null) ?? [])
    .filter((item) => item.words)
    .sort((a, b) => Number(a.position) - Number(b.position));

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String((row.title as Record<string, string> | null)?.en ?? row.slug),
    level: (row.level as string | null) ?? null,
    published: Boolean(row.is_published),
    words: items.map((item) => {
      const w = item.words as Row;
      const translations: AdminWord["translations"] = {};
      for (const t of (w.word_translations as Row[] | null) ?? []) {
        const language = t.language as DictionaryLanguage;
        translations[language] = {
          language,
          translation: String(t.translation),
          alternatives: (t.alternatives as string[] | null) ?? [],
          reviewed: Boolean(t.reviewed),
          source: String(t.source),
        };
      }
      return {
        id: String(w.id),
        lemma: String(w.lemma),
        partOfSpeech: String(w.part_of_speech ?? ""),
        ipa: (w.ipa as string | null) ?? null,
        example: (w.example as string | null) ?? null,
        level: (w.cefr_level as CefrLevel | null) ?? null,
        levelSource: (w.level_source as LevelSource | null) ?? null,
        translations,
      };
    }),
  };
}

// Admin only: RLS shows unpublished sets and unreviewed translations to
// admins and hides them from everyone else.
export async function listWordSets(supabase: SupabaseClient): Promise<AdminWordSet[]> {
  const { data, error } = await supabase.from("word_sets").select(SET_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toWordSet);
}

export async function getWordSet(supabase: SupabaseClient, slug: string): Promise<AdminWordSet | null> {
  const { data, error } = await supabase.from("word_sets").select(SET_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toWordSet(data) : null;
}
