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
    .select(PRACTICE_COLUMNS)
    .eq("word_id", wordId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error) throw error;
  return (data ?? []).map(toPracticeEntry);
}

export const PRACTICE_COLUMNS = "id, sentence, tense, tense_ok, issues, created_at";

// A practice_sentences row selected with PRACTICE_COLUMNS.
export function toPracticeEntry(row: Record<string, unknown>): PracticeEntry {
  return {
    id: Number(row.id),
    sentence: String(row.sentence),
    tense: tenseSchema.nullable().catch(null).parse(row.tense),
    tenseOk: typeof row.tense_ok === "boolean" ? row.tense_ok : null,
    // Rows are the learner's own writes; a bad shape just shows no issues.
    issues: issuesSchema.catch([]).parse(row.issues),
    at: String(row.created_at),
  };
}

// Tenses this word already has a clean sentence for: right tense, no mistakes.
export function masteredTenses(history: PracticeEntry[]): Set<Tense> {
  return new Set(
    history.flatMap((e) => (e.tense && e.tenseOk && e.issues.length === 0 ? [e.tense] : [])),
  );
}

export type WritingStats = { sentences: number; cleanSentences: number; tensesUsed: number; wordTenses: number };

// My writing totals for achievements. RLS keeps other learners' rows out.
export async function getWritingStats(supabase: SupabaseClient): Promise<WritingStats> {
  const table = () => supabase.from("practice_sentences");
  const [all, clean, tensed] = await Promise.all([
    table().select("id", { count: "exact", head: true }),
    table().select("id", { count: "exact", head: true }).eq("issues", "[]").or("tense_ok.is.null,tense_ok.is.true"),
    // shortcut: reads at most the API row cap (1000) clean tense sentences;
    // count in SQL if learners get past that.
    table().select("word_id, tense").eq("issues", "[]").eq("tense_ok", true),
  ]);
  if (all.error) throw all.error;
  if (clean.error) throw clean.error;
  if (tensed.error) throw tensed.error;
  return { sentences: all.count ?? 0, cleanSentences: clean.count ?? 0, ...tenseCoverage(tensed.data ?? []) };
}

// Distinct tenses overall, and the most tenses on a single word.
export function tenseCoverage(rows: { word_id: string; tense: string | null }[]) {
  const overall = new Set<string>();
  const perWord = new Map<string, Set<string>>();
  for (const { word_id, tense } of rows) {
    if (!tense) continue;
    overall.add(tense);
    perWord.set(word_id, (perWord.get(word_id) ?? new Set()).add(tense));
  }
  return { tensesUsed: overall.size, wordTenses: Math.max(0, ...[...perWord.values()].map((set) => set.size)) };
}
