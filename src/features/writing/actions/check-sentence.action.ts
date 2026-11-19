"use server";

import { z } from "zod";

import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";
import { checkGrammar, GrammarRateLimitError, sentenceSchema } from "../grammar-check";
import type { PracticeEntry } from "../history";
import { detectTenses, tenseSchema, type Tense } from "../tenses";
import { containsWord } from "../word-forms";

const inputSchema = z.object({
  sentence: sentenceSchema,
  wordId: z.uuid(),
  tense: tenseSchema.nullable(),
});

export type CheckSentenceError = "invalid_data" | "not_signed_in" | "missing_word" | "rate_limited" | "unexpected";

type Result =
  | { success: true; entry: PracticeEntry; detected: Tense[] }
  | { success: false; error: CheckSentenceError };

export async function checkSentenceAction(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };
  const { sentence, wordId, tense } = parsed.data;

  // Only learners may spend our LanguageTool quota.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_signed_in" };

  // The word comes from my own list, not from the browser.
  const { data: mine, error: wordError } = await supabase
    .from("user_words")
    .select("words(lemma)")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();
  if (wordError) {
    logSupabaseError("[Writing] Loading the word failed", wordError);
    return { success: false, error: "unexpected" };
  }
  const lemma = (mine?.words as { lemma?: unknown } | null)?.lemma;
  if (typeof lemma !== "string") return { success: false, error: "invalid_data" };
  // Checked before LanguageTool, so a sentence without the word costs no quota and is not saved.
  if (!containsWord(sentence, lemma)) return { success: false, error: "missing_word" };

  let issues;
  try {
    issues = await checkGrammar(sentence);
  } catch (error) {
    if (error instanceof GrammarRateLimitError) return { success: false, error: "rate_limited" };
    console.error("[Writing] Grammar check failed", error instanceof Error ? error.message : error);
    return { success: false, error: "unexpected" };
  }

  const detected = detectTenses(sentence);
  const tenseOk = tense ? detected.includes(tense) : null;
  // RLS lets learners save practice only for words in their own list.
  const { data, error } = await supabase
    .from("practice_sentences")
    .insert({ word_id: wordId, sentence, tense, tense_ok: tenseOk, issues })
    .select("id, created_at")
    .single();
  // The check itself still succeeded, so show it even when saving fails.
  if (error) logSupabaseError("[Writing] Saving practice failed", error);

  return {
    success: true,
    detected,
    entry: {
      id: data?.id ?? -Date.now(),
      sentence,
      tense,
      tenseOk,
      issues,
      at: data?.created_at ?? new Date().toISOString(),
    },
  };
}
