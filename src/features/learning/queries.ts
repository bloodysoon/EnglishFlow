import type { SupabaseClient } from "@supabase/supabase-js";

import type { CefrLevel } from "@/features/dictionary/cefr";
import { learnerLevel, type LearnerLevel } from "@/features/leitner/xp";
import { splitTranslationCell } from "@/features/dictionary/dictionary-translations";
import { fetchWiktionaryDraft } from "./lookup";
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

export type WordCard = {
  wordId: string;
  lemma: string;
  partOfSpeech: string;
  ipa: string | null;
  example: string | null;
  level: CefrLevel | null;
  translation: string | null;
  alternatives: string[];
  definition: string | null;
  // Straight from Wiktionary, not checked by a person.
  autoTranslation: boolean;
};

export type ReviewCard = WordCard & { box: number };

// A words row (with its one translation in the learner's language) as a card.
function toCard(word: Row): WordCard {
  const translation = ((word.word_translations as Row[] | null) ?? [])[0];
  return {
    wordId: String(word.id),
    lemma: String(word.lemma),
    partOfSpeech: String(word.part_of_speech ?? ""),
    ipa: (word.ipa as string | null) ?? null,
    example: (word.example as string | null) ?? null,
    level: (word.cefr_level as CefrLevel | null) ?? null,
    translation: translation ? String(translation.translation) : null,
    alternatives: translation ? ((translation.alternatives as string[] | null) ?? []) : [],
    definition: (word.definition as string | null) ?? null,
    autoTranslation: translation ? translation.reviewed === false : false,
  };
}

const CARD_COLUMNS =
  "id, lemma, part_of_speech, ipa, example, definition, cefr_level, word_translations(language, translation, alternatives, reviewed)";

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
    .select(`word_id, box, due_on, words(${CARD_COLUMNS})`)
    .eq("user_id", userId)
    .lte("due_on", today)
    .eq("words.word_translations.language", language)
    .order("due_on", { ascending: true })
    .order("box", { ascending: true })
    .limit(200);

  if (error) throw error;

  return ((data as Row[] | null) ?? [])
    .filter((row) => row.words)
    .map((row) => ({ ...toCard(row.words as Row), box: Number(row.box) }));
}

// ---------------------------------------------------------------------
// Word triage ("I know it" / "Learn it") and the known-words quiz
// ---------------------------------------------------------------------

// Cards for word ids from pick_known_words, in the order given.
async function cardsFor(supabase: SupabaseClient, rpc: string, count: number, language: "ru" | "ro") {
  const picked = await supabase.rpc(rpc, { p_count: count });
  if (picked.error) throw picked.error;
  const ids = ((picked.data as string[] | null) ?? []).map(String);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("words")
    .select(CARD_COLUMNS)
    .in("id", ids)
    .eq("word_translations.language", language);
  if (error) throw error;

  const byId = new Map(((data as Row[] | null) ?? []).map((w) => [String(w.id), toCard(w)]));
  return ids.map((id) => byId.get(id)).filter((card): card is WordCard => card !== undefined);
}

// Topics that have words, for the card's filter. Empty until topics are filled in.
export async function getTopicsInUse(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.rpc("dictionary_topics");
  if (error) throw error;
  return ((data as { topic: string }[] | null) ?? []).map((row) => row.topic);
}

// A word card for sorting. wordId is null for a dictionary word nobody has
// saved yet: it is saved (as the learner's own copy) when they sort it.
// It carries both translations, so the card can switch language on the spot.
export type CardTranslation = { translation: string; alternatives: string[]; auto: boolean };
export type TriageCard = Omit<WordCard, "wordId" | "translation" | "alternatives" | "autoTranslation"> & {
  wordId: string | null;
  translations: Record<"ru" | "ro", CardTranslation | null>;
  // Hand-filled definitions from translations.csv; the English one is shown when missing.
  definitions: Record<"ru" | "ro", string | null>;
};

// Definitions in Russian and Romanian, by lemma. Empty if the columns are missing (migration not applied).
async function filledDefinitions(supabase: SupabaseClient, lemmas: string[]) {
  const { data } = await supabase
    .from("dictionary_entries")
    .select("lemma, definition_ru, definition_ro")
    .in("lemma", lemmas);
  return new Map(
    ((data as Row[] | null) ?? []).map((row) => [
      String(row.lemma),
      { ru: (row.definition_ru as string | null) || null, ro: (row.definition_ro as string | null) || null },
    ]),
  );
}

function sharedTriageCard(word: Row): TriageCard {
  const rows = (word.word_translations as Row[] | null) ?? [];
  const pick = (language: "ru" | "ro"): CardTranslation | null => {
    const row = rows.find((r) => r.language === language);
    return row
      ? {
          translation: String(row.translation),
          alternatives: (row.alternatives as string[] | null) ?? [],
          auto: row.reviewed === false,
        }
      : null;
  };
  return {
    wordId: String(word.id),
    lemma: String(word.lemma),
    partOfSpeech: String(word.part_of_speech ?? ""),
    ipa: (word.ipa as string | null) ?? null,
    example: (word.example as string | null) ?? null,
    level: (word.cefr_level as CefrLevel | null) ?? null,
    definition: (word.definition as string | null) ?? null,
    translations: { ru: pick("ru"), ro: pick("ro") },
    definitions: { ru: null, ro: null },
  };
}

// Hand-filled translations (content/dictionary/translations.csv) for these
// words, by lemma. Empty if the column is missing (migration not applied).
export async function filledTranslations(supabase: SupabaseClient, lemmas: string[], language: "ru" | "ro") {
  const column = language === "ru" ? "translation_ru" : "translation_ro";
  const { data } = await supabase.from("dictionary_entries").select(`lemma, ${column}`).in("lemma", lemmas);
  return new Map(
    ((data as Row[] | null) ?? []).flatMap((row) => {
      const cell = splitTranslationCell(row[column] as string | null);
      return cell ? [[String(row.lemma), cell] as const] : [];
    }),
  );
}

// Random dictionary words I have not sorted yet. A word that is also in a
// published set uses that checked entry; the rest come from Wiktionary.
export type CardFilters = { topics: string[]; partsOfSpeech: string[] };

export async function pickDictionaryCards(
  supabase: SupabaseClient,
  filters: CardFilters = { topics: [], partsOfSpeech: [] },
  count = 3,
): Promise<TriageCard[]> {
  const picked = await supabase.rpc("pick_dictionary_words", {
    p_count: count,
    p_topics: filters.topics,
    p_parts_of_speech: filters.partsOfSpeech,
  });
  if (picked.error) throw picked.error;
  const entries = (picked.data as { lemma: string; part_of_speech: string; cefr_level: CefrLevel }[] | null) ?? [];
  if (entries.length === 0) return [];

  // RLS returns shared words only when they sit in a published set.
  const { data: shared, error } = await supabase
    .from("words")
    .select(CARD_COLUMNS)
    .in(
      "lemma",
      entries.map((e) => e.lemma),
    )
    .is("owner_id", null);
  if (error) throw error;
  const checked = new Map(((shared as Row[] | null) ?? []).map((w) => [String(w.lemma), sharedTriageCard(w)]));
  const lemmas = entries.map((e) => e.lemma);
  const filled = {
    ru: await filledTranslations(supabase, lemmas, "ru"),
    ro: await filledTranslations(supabase, lemmas, "ro"),
  };
  const definitions = await filledDefinitions(supabase, lemmas);
  const noDefinitions = { ru: null, ro: null };

  return Promise.all(
    entries.map(async (entry): Promise<TriageCard> => {
      const known = checked.get(entry.lemma);
      if (known) return { ...known, definitions: definitions.get(entry.lemma) ?? noDefinitions };

      const draft = await fetchWiktionaryDraft(entry.lemma, entry.part_of_speech);
      // The hand-filled translation wins; Wiktionary fills the gaps.
      const pick = (language: "ru" | "ro"): CardTranslation | null => {
        const t = filled[language].get(entry.lemma) ?? draft?.translations[language] ?? null;
        return t ? { translation: t.translation, alternatives: t.alternatives, auto: true } : null;
      };
      return {
        wordId: null,
        lemma: entry.lemma,
        partOfSpeech: draft?.pos || entry.part_of_speech,
        ipa: draft?.ipa ?? null,
        example: draft?.example ?? null,
        level: entry.cefr_level,
        definition: draft?.definition ?? null,
        translations: { ru: pick("ru"), ro: pick("ro") },
        definitions: definitions.get(entry.lemma) ?? noDefinitions,
      };
    }),
  );
}

// Random words I marked as known, for a quiz.
export function pickKnownWords(supabase: SupabaseClient, language: "ru" | "ro", count = 10) {
  return cardsFor(supabase, "pick_known_words", count, language);
}
