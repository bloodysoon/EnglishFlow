import { z } from "zod";

export const MAX_SENTENCE_LENGTH = 300;

export const sentenceSchema = z.string().trim().min(1).max(MAX_SENTENCE_LENGTH);

export type GrammarIssue = {
  // The wrong part of the sentence, as the learner typed it.
  fragment: string;
  message: string;
  suggestions: string[];
};

// Only the fields we use from LanguageTool's /v2/check answer.
const responseSchema = z.object({
  matches: z.array(
    z.object({
      message: z.string(),
      offset: z.number().int().nonnegative(),
      length: z.number().int().nonnegative(),
      replacements: z.array(z.object({ value: z.string() })),
    }),
  ),
});

// Turns LanguageTool's JSON into issues; throws on a shape we don't know.
export function toGrammarIssues(text: string, json: unknown): GrammarIssue[] {
  return responseSchema.parse(json).matches.map((match) => ({
    fragment: text.slice(match.offset, match.offset + match.length),
    message: match.message,
    suggestions: match.replacements.slice(0, 3).map((r) => r.value),
  }));
}

export class GrammarRateLimitError extends Error {}

// Server only. LANGUAGETOOL_URL points to a self-hosted server; without it we use the free public API.
// shortcut: the public API is limited per IP (~20 requests/min) and Vercel shares IPs, self-host before launch.
export async function checkGrammar(text: string): Promise<GrammarIssue[]> {
  const url = process.env.LANGUAGETOOL_URL ?? "https://api.languagetool.org/v2/check";
  const response = await fetch(url, {
    method: "POST",
    body: new URLSearchParams({ text, language: "en-US" }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (response.status === 429) throw new GrammarRateLimitError();
  if (!response.ok) throw new Error(`LanguageTool answered ${response.status}`);
  return toGrammarIssues(text, await response.json());
}
