"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getLearningSettings } from "@/features/settings/profile";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";
import { TOPICS, TOPIC_PARTS_OF_SPEECH } from "@/features/dictionary/topics";
import { customWordSchema, lemmaSchema } from "../custom-word";
import { fetchWiktionaryDraft, lookupWord, type WordLookup } from "../lookup";
import { filledTranslations, pickDictionaryCards, type TriageCard } from "../queries";

type Failure<E extends string> = { success: false; error: E };

const cardFiltersSchema = z.object({
  topics: z.array(z.enum(TOPICS)).max(TOPICS.length),
  partsOfSpeech: z.array(z.enum(TOPIC_PARTS_OF_SPEECH)).max(TOPIC_PARTS_OF_SPEECH.length),
});

function refreshLearningPages() {
  revalidatePath("/learn", "layout");
  revalidatePath("/dashboard");
}

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

// ---------------------------------------------------------------------

export async function lookupWordAction(
  input: unknown,
): Promise<{ success: true; result: WordLookup } | Failure<"invalid_word" | "not_signed_in">> {
  const parsed = z.object({ lemma: lemmaSchema }).safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_word" };

  // Signed-in only: this calls Wiktionary on the learner's behalf.
  const session = await signedIn();
  if (!session) return { success: false, error: "not_signed_in" };

  const { settings } = await getLearningSettings();
  const result = await lookupWord(session.supabase, session.user.id, parsed.data.lemma, settings.translationLanguage);
  return { success: true, result };
}

// ---------------------------------------------------------------------

export async function addWordsAction(
  input: unknown,
): Promise<{ success: true; added: number } | Failure<"invalid_data" | "not_signed_in" | "unexpected">> {
  const parsed = z
    .object({ wordIds: z.array(z.uuid()).min(1).max(200), startNow: z.boolean().default(false) })
    .safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const session = await signedIn();
  if (!session) return { success: false, error: "not_signed_in" };

  const { data, error } = await session.supabase.rpc("add_words_to_my_list", {
    p_word_ids: parsed.data.wordIds,
    p_start_now: parsed.data.startNow,
  });
  if (error) {
    logSupabaseError("[Learn] Adding words failed", error);
    return { success: false, error: "unexpected" };
  }

  // Queued words: let today's goal bring some in right away.
  if (!parsed.data.startNow) await session.supabase.rpc("introduce_new_words");

  refreshLearningPages();
  return { success: true, added: Number(data ?? 0) };
}

// ---------------------------------------------------------------------

export async function addCustomWordAction(
  input: unknown,
): Promise<{ success: true } | Failure<"invalid_data" | "daily_limit" | "not_signed_in" | "unexpected">> {
  const parsed = customWordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const session = await signedIn();
  if (!session) return { success: false, error: "not_signed_in" };

  const w = parsed.data;
  const { error } = await session.supabase.rpc("add_custom_word", {
    p_lemma: w.lemma,
    p_part_of_speech: w.partOfSpeech,
    p_language: w.language,
    p_translation: w.translation,
    p_alternatives: w.alternatives,
    p_example: w.example || null,
    p_ipa: w.ipa || null,
  });

  if (error) {
    if (error.message.includes("daily_limit")) return { success: false, error: "daily_limit" };
    if (error.message.includes("invalid_word")) return { success: false, error: "invalid_data" };
    logSupabaseError("[Learn] Adding a custom word failed", error);
    return { success: false, error: "unexpected" };
  }

  refreshLearningPages();
  return { success: true };
}

// ---------------------------------------------------------------------

export async function removeMyWordAction(
  input: unknown,
): Promise<{ success: true } | Failure<"invalid_data" | "not_signed_in" | "unexpected">> {
  const parsed = z.object({ wordId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const session = await signedIn();
  if (!session) return { success: false, error: "not_signed_in" };

  const { error } = await session.supabase.rpc("remove_my_word", { p_word_id: parsed.data.wordId });
  if (error) {
    logSupabaseError("[Learn] Removing a word failed", error);
    return { success: false, error: "unexpected" };
  }

  refreshLearningPages();
  return { success: true };
}

// ---------------------------------------------------------------------
// Word triage and the known-words quiz
// ---------------------------------------------------------------------

export async function triageWordAction(
  input: unknown,
): Promise<
  { success: true; wordId: string } | Failure<"invalid_data" | "daily_limit" | "not_signed_in" | "unexpected">
> {
  const parsed = z
    .object({
      wordId: z.uuid().nullable(),
      lemma: lemmaSchema,
      partOfSpeech: z.string().max(20),
      known: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const session = await signedIn();
  if (!session) return { success: false, error: "not_signed_in" };
  const { wordId, lemma, partOfSpeech, known } = parsed.data;

  let error;
  // The saved word's id, so the card can undo this answer (removeMyWordAction).
  let savedId = wordId;
  if (wordId) {
    // A checked word from a published set.
    ({ error } = await session.supabase.rpc("triage_word", { p_word_id: wordId, p_known: known }));
  } else {
    // A dictionary word: the details come from Wiktionary here on the
    // server (cached), never from the browser.
    const [{ settings }, draft] = await Promise.all([getLearningSettings(), fetchWiktionaryDraft(lemma, partOfSpeech)]);
    const filled = await filledTranslations(session.supabase, [lemma], settings.translationLanguage);
    const translation = filled.get(lemma) ?? draft?.translations[settings.translationLanguage] ?? null;
    let data;
    ({ data, error } = await session.supabase.rpc("add_dictionary_word", {
      p_lemma: lemma,
      p_known: known,
      p_part_of_speech: draft?.pos || partOfSpeech,
      p_ipa: draft?.ipa?.slice(0, 100) ?? null,
      p_definition: draft?.definition?.slice(0, 500) ?? null,
      p_example: draft?.example?.slice(0, 300) ?? null,
      p_language: settings.translationLanguage,
      p_translation: translation?.translation.slice(0, 200) ?? null,
      p_alternatives: (translation?.alternatives ?? []).slice(0, 5).map((a) => a.slice(0, 200)),
    }));
    savedId = (data as string | null) ?? null;
  }

  if (error) {
    if (error.message.includes("daily_limit")) return { success: false, error: "daily_limit" };
    if (error.message.includes("invalid_word")) return { success: false, error: "invalid_data" };
    logSupabaseError("[Learn] Triage failed", error);
    return { success: false, error: "unexpected" };
  }
  if (!savedId) return { success: false, error: "unexpected" };

  refreshLearningPages();
  return { success: true, wordId: savedId };
}

// More random words for the triage card, in the learner's language.
export async function pickNewWordsAction(
  input: unknown,
): Promise<{ success: true; cards: TriageCard[] } | Failure<"invalid_data" | "not_signed_in" | "unexpected">> {
  const parsed = cardFiltersSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const session = await signedIn();
  if (!session) return { success: false, error: "not_signed_in" };
  try {
    return { success: true, cards: await pickDictionaryCards(session.supabase, parsed.data) };
  } catch (error) {
    logSupabaseError("[Learn] Picking new words failed", error);
    return { success: false, error: "unexpected" };
  }
}

export async function forgetKnownWordAction(
  input: unknown,
): Promise<{ success: true } | Failure<"invalid_data" | "not_signed_in" | "unexpected">> {
  const parsed = z.object({ wordId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const session = await signedIn();
  if (!session) return { success: false, error: "not_signed_in" };

  const { error } = await session.supabase.rpc("forget_known_word", { p_word_id: parsed.data.wordId });
  if (error) {
    logSupabaseError("[Learn] Forgetting a known word failed", error);
    return { success: false, error: "unexpected" };
  }

  // No revalidation here: it would re-render the quiz page mid-round.
  // Learning pages are dynamic and fetch fresh data on the next visit.
  return { success: true };
}
