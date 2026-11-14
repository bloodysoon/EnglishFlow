"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getLearningSettings } from "@/features/settings/profile";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";
import { customWordSchema, lemmaSchema } from "../custom-word";
import { lookupWord, type WordLookup } from "../lookup";

type Failure<E extends string> = { success: false; error: E };

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
