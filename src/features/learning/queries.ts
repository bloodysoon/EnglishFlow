import type { SupabaseClient } from "@supabase/supabase-js";

import type { TimelineDay } from "@/features/achievements/timeline";
import type { CefrLevel } from "@/features/dictionary/cefr";
import { learnerLevel, type LearnerLevel } from "@/features/leitner/xp";
import { splitTranslationCell } from "@/features/dictionary/dictionary-translations";
import { fetchWiktionaryDraft } from "./lookup";
import type { Statistics } from "./statistics";
import { learningStats, streakDays, utcDay, type LearningStats, type UserWordRow } from "./stats";
import { wordTimeline, type TimelineStep } from "./timeline";

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
// Hard words: the ones the learner forgets most (ranked in SQL)
// ---------------------------------------------------------------------

export type HardWord = {
  wordId: string;
  lemma: string;
  box: number;
  forgot: number;
  reviews: number;
};

export async function getHardWords(supabase: SupabaseClient, limit = 5, offset = 0): Promise<HardWord[]> {
  const { data, error } = await supabase.rpc("my_hard_words", { p_limit: limit, p_offset: offset });
  if (error) throw error;

  return ((data ?? []) as Row[]).map((row) => ({
    wordId: String(row.word_id),
    lemma: String(row.lemma),
    box: Number(row.box),
    forgot: Number(row.forgot),
    reviews: Number(row.reviews),
  }));
}

// ---------------------------------------------------------------------
// Statistics page (aggregated in SQL by my_statistics)
// ---------------------------------------------------------------------

export async function getStatistics(supabase: SupabaseClient): Promise<Statistics> {
  const { data, error } = await supabase.rpc("my_statistics");
  if (error) throw error;

  const raw = (data ?? {}) as {
    today?: string;
    days?: Row[];
    hours?: Row[];
    levels?: Row[];
    mastery?: { count?: number; avg_days?: number | string | null };
  };

  const hoursUtc = Array<number>(24).fill(0);
  for (const row of raw.hours ?? []) hoursUtc[Number(row.hour)] = Number(row.reviews);

  return {
    today: raw.today ?? utcDay(),
    days: (raw.days ?? []).map((row) => ({
      day: String(row.day),
      remembered: Number(row.remembered),
      forgot: Number(row.forgot),
      xp: Number(row.xp),
    })),
    hoursUtc,
    levels: (raw.levels ?? []).map((row) => ({
      level: String(row.level),
      remembered: Number(row.remembered),
      forgot: Number(row.forgot),
    })),
    mastery: {
      count: Number(raw.mastery?.count ?? 0),
      // numeric arrives as a number or a string; null when nothing was mastered.
      avgDays: raw.mastery?.avg_days == null ? null : Number(raw.mastery.avg_days),
    },
  };
}

// ---------------------------------------------------------------------
// Timeline page (one row per day, from my_timeline)
// ---------------------------------------------------------------------

export async function getTimeline(supabase: SupabaseClient): Promise<TimelineDay[]> {
  const { data, error } = await supabase.rpc("my_timeline");
  if (error) throw error;

  const words = (list: unknown) =>
    ((list as Row[] | null) ?? []).map((w) => ({ id: String(w.id), lemma: String(w.lemma), known: w.known === true }));
  return ((data as Row[] | null) ?? []).map((row) => ({
    day: String(row.day),
    active: row.active === true,
    remembered: Number(row.remembered),
    forgot: Number(row.forgot),
    xp: Number(row.xp),
    mastered: Number(row.mastered),
    levels: (row.levels ?? {}) as Record<string, number>,
    added: Number(row.added),
    known: Number(row.known),
    words: words(row.words),
    boxes: Object.fromEntries(
      Object.entries((row.boxes ?? {}) as Record<string, Row>).map(([box, b]) => [
        Number(box),
        { count: Number(b.count), words: words(b.words) },
      ]),
    ),
  }));
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

// Both translations and definitions, so the review card can switch language like the Learn card.
export type ReviewCard = Omit<TriageCard, "wordId"> & { wordId: string; box: number };

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

// Words due today with their translations. RLS hides words of unpublished
// sets and unreviewed translations, so those drop out here (a word without
// a translation still shows, with a note).
export async function getReviewQueue(
  supabase: SupabaseClient,
  userId: string,
  today: string = utcDay(),
): Promise<ReviewCard[]> {
  const { data, error } = await supabase
    .from("user_words")
    .select(`word_id, box, due_on, words(${CARD_COLUMNS})`)
    .eq("user_id", userId)
    .lte("due_on", today)
    .order("due_on", { ascending: true })
    .order("box", { ascending: true })
    .limit(200);

  if (error) throw error;

  const cards = ((data as Row[] | null) ?? [])
    .filter((row) => row.words)
    .map((row) => ({ ...sharedTriageCard(row.words as Row), wordId: String(row.word_id), box: Number(row.box) }));

  return fillFromDictionary(supabase, cards);
}

// A saved word carries one language; the dictionary fills the other and the definitions.
async function fillFromDictionary<T extends Pick<TriageCard, "lemma" | "translations" | "definitions">>(
  supabase: SupabaseClient,
  cards: T[],
): Promise<T[]> {
  const lemmas = cards.map((card) => card.lemma);
  const [ru, ro, definitions] = await Promise.all([
    filledTranslations(supabase, lemmas, "ru"),
    filledTranslations(supabase, lemmas, "ro"),
    filledDefinitions(supabase, lemmas),
  ]);
  const filled = { ru, ro };
  const pick = (card: T, language: "ru" | "ro"): CardTranslation | null => {
    const t = filled[language].get(card.lemma);
    return card.translations[language] ?? (t ? { ...t, auto: true } : null);
  };
  return cards.map((card) => ({
    ...card,
    translations: { ru: pick(card, "ru"), ro: pick(card, "ro") },
    definitions: definitions.get(card.lemma) ?? card.definitions,
  }));
}

// One of my words with its whole story (the word page). Null when it is not in my words.
export type WordHistory = {
  card: ReviewCard;
  known: boolean;
  dueOn: string | null;
  reviewCount: number;
  steps: TimelineStep[];
};

export async function getWordHistory(
  supabase: SupabaseClient,
  userId: string,
  wordId: string,
): Promise<WordHistory | null> {
  const [mine, log] = await Promise.all([
    supabase
      .from("user_words")
      .select(`box, due_on, known, added_at, review_count, words(${CARD_COLUMNS})`)
      .eq("user_id", userId)
      .eq("word_id", wordId)
      .maybeSingle(),
    supabase
      .from("xp_events")
      .select("reason, amount, created_at")
      .eq("user_id", userId)
      .eq("word_id", wordId)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);
  if (mine.error) throw mine.error;
  if (log.error) throw log.error;
  const row = mine.data as Row | null;
  if (!row?.words) return null;

  const [card] = await fillFromDictionary(supabase, [
    { ...sharedTriageCard(row.words as Row), wordId, box: Number(row.box) },
  ]);
  const events = ((log.data as Row[] | null) ?? []).map((e) => ({
    reason: String(e.reason),
    amount: Number(e.amount),
    at: String(e.created_at),
  }));
  return {
    card,
    known: row.known === true,
    dueOn: (row.due_on as string | null) ?? null,
    reviewCount: Number(row.review_count),
    steps: wordTimeline(String(row.added_at), events),
  };
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

  const lemmas = entries.map((e) => e.lemma);
  // All four lookups need only the lemmas, so they run together (one round
  // trip instead of four in a row).
  const [{ data: shared, error }, ru, ro, definitions] = await Promise.all([
    // RLS returns shared words only when they sit in a published set.
    supabase.from("words").select(CARD_COLUMNS).in("lemma", lemmas).is("owner_id", null),
    filledTranslations(supabase, lemmas, "ru"),
    filledTranslations(supabase, lemmas, "ro"),
    filledDefinitions(supabase, lemmas),
  ]);
  if (error) throw error;
  const checked = new Map(((shared as Row[] | null) ?? []).map((w) => [String(w.lemma), sharedTriageCard(w)]));
  const filled = { ru, ro };
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
