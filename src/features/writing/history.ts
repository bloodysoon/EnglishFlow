import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { GrammarIssue } from "./grammar-check";
import { tenseSchema, type Tense } from "./tenses";

export type PracticeEntry = {
  id: number;
  sentence: string;
  tense: Tense | null;
  tenseOk: boolean | null;
  issues: GrammarIssue[];
  at: string;
};

const HISTORY_LIMIT = 30;

const issuesSchema = z.array(
  z.object({ fragment: z.string(), message: z.string(), suggestions: z.array(z.string()) }),
);

// My sentences for one word, newest first. RLS keeps other learners' rows out.
export async function getPracticeHistory(supabase: SupabaseClient, wordId: string): Promise<PracticeEntry[]> {
  const { data, error } = await supabase
    .from("practice_sentences")
    .select("id, sentence, tense, tense_ok, issues, created_at")
    .eq("word_id", wordId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: Number(row.id),
    sentence: String(row.sentence),
    tense: tenseSchema.nullable().catch(null).parse(row.tense),
    tenseOk: typeof row.tense_ok === "boolean" ? row.tense_ok : null,
    // Rows are the learner's own writes; a bad shape just shows no issues.
    issues: issuesSchema.catch([]).parse(row.issues),
    at: String(row.created_at),
  }));
}

// Tenses this word already has a clean sentence for: right tense, no mistakes.
export function masteredTenses(history: PracticeEntry[]): Set<Tense> {
  return new Set(
    history.flatMap((e) => (e.tense && e.tenseOk && e.issues.length === 0 ? [e.tense] : [])),
  );
}
