import type { SupabaseClient } from "@supabase/supabase-js";

import type { CefrLevel } from "@/features/dictionary/cefr";
import { learnerLevel, type LearnerLevel } from "@/features/leitner/xp";
import { learningStats, streakDays, utcDay, type LearningStats, type UserWordRow } from "./stats";

type Row = Record<string, unknown>;

// ---------------------------------------------------------------------
// Dashboard summary
// ---------------------------------------------------------------------

export type LearningOverview = LearningStats & {
  xpTotal: number;
  level: LearnerLevel;
  streak: number;
  today: string;
};

export async function getLearningOverview(supabase: SupabaseClient): Promise<LearningOverview> {
  const { data, error } = await supabase.rpc("my_learning_summary");
  if (error) throw error;

  const summary = (data ?? {}) as { words?: UserWordRow[]; xp_total?: number; active_days?: string[]; today?: string };
  const today = summary.today ?? utcDay();
  const xpTotal = Number(summary.xp_total ?? 0);

  return {
    ...learningStats(summary.words ?? [], today),
    xpTotal,
    level: learnerLevel(xpTotal),
    streak: streakDays(summary.active_days ?? [], today),
    today,
  };
}

// ---------------------------------------------------------------------
// Today's reviews
// ---------------------------------------------------------------------

export type ReviewCard = {
  wordId: string;
  box: number;
  lemma: string;
  partOfSpeech: string;
  ipa: string | null;
  example: string | null;
  level: CefrLevel | null;
  translation: string | null;
  alternatives: string[];
};

// Words due today with their translation in the learner's language. RLS
// hides words of unpublished sets and unreviewed translations, so those
// drop out here (a word without a translation still shows, with a note).
export async function getReviewQueue(
  supabase: SupabaseClient,
  userId: string,
  language: "ru" | "ro",
  today: string = utcDay(),
): Promise<ReviewCard[]> {
  const { data, error } = await supabase
    .from("user_words")
    .select(
      "word_id, box, due_on, words(id, lemma, part_of_speech, ipa, example, cefr_level, word_translations(language, translation, alternatives))",
    )
    .eq("user_id", userId)
    .lte("due_on", today)
    .eq("words.word_translations.language", language)
    .order("due_on", { ascending: true })
    .order("box", { ascending: true })
    .limit(200);

  if (error) throw error;

  return ((data as Row[] | null) ?? [])
    .filter((row) => row.words)
    .map((row) => {
      const word = row.words as Row;
      const translation = ((word.word_translations as Row[] | null) ?? [])[0];
      return {
        wordId: String(row.word_id),
        box: Number(row.box),
        lemma: String(word.lemma),
        partOfSpeech: String(word.part_of_speech ?? ""),
        ipa: (word.ipa as string | null) ?? null,
        example: (word.example as string | null) ?? null,
        level: (word.cefr_level as CefrLevel | null) ?? null,
        translation: translation ? String(translation.translation) : null,
        alternatives: translation ? ((translation.alternatives as string[] | null) ?? []) : [],
      };
    });
}

// ---------------------------------------------------------------------
// Catalog of published sets
// ---------------------------------------------------------------------

export type CatalogSet = {
  slug: string;
  title: Record<string, string>;
  description: Record<string, string> | null;
  level: string | null;
  wordCount: number;
  // How many of its words are already in my words.
  started: number;
};

export async function getCatalog(supabase: SupabaseClient, userId: string): Promise<CatalogSet[]> {
  const [sets, mine] = await Promise.all([
    supabase
      .from("word_sets")
      .select("slug, title, description, level, created_at, word_set_items(word_id)")
      // Admins can also read drafts; the catalog shows published sets only.
      .eq("is_published", true)
      .order("created_at", { ascending: true }),
    supabase.from("user_words").select("word_id").eq("user_id", userId),
  ]);

  if (sets.error) throw sets.error;
  if (mine.error) throw mine.error;

  const myWords = new Set(((mine.data as Row[] | null) ?? []).map((r) => String(r.word_id)));

  return ((sets.data as Row[] | null) ?? []).map((set) => {
    const items = (set.word_set_items as Row[] | null) ?? [];
    return {
      slug: String(set.slug),
      title: (set.title as Record<string, string>) ?? { en: String(set.slug) },
      description: (set.description as Record<string, string> | null) ?? null,
      level: (set.level as string | null) ?? null,
      wordCount: items.length,
      started: items.filter((item) => myWords.has(String(item.word_id))).length,
    };
  });
}
