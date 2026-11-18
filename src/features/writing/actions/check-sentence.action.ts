"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { checkGrammar, GrammarRateLimitError, sentenceSchema, type GrammarIssue } from "../grammar-check";

const inputSchema = z.object({ sentence: sentenceSchema });

export type CheckSentenceError = "invalid_data" | "not_signed_in" | "rate_limited" | "unexpected";

type Result = { success: true; issues: GrammarIssue[] } | { success: false; error: CheckSentenceError };

export async function checkSentenceAction(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  // Only learners may spend our LanguageTool quota.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_signed_in" };

  try {
    return { success: true, issues: await checkGrammar(parsed.data.sentence) };
  } catch (error) {
    if (error instanceof GrammarRateLimitError) return { success: false, error: "rate_limited" };
    console.error("[Writing] Grammar check failed", error instanceof Error ? error.message : error);
    return { success: false, error: "unexpected" };
  }
}
