"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { checkSentenceAction } from "@/features/writing/actions/check-sentence.action";
import { MAX_SENTENCE_LENGTH, type GrammarIssue } from "@/features/writing/grammar-check";

type T = PlatformDictionary["sentenceCheck"];
type Common = PlatformDictionary["common"];

// Practice box: the learner writes a sentence with the word and LanguageTool marks the mistakes.
export function SentenceCheck({ lemma, t, common }: { lemma: string; t: T; common: Common }) {
  const [sentence, setSentence] = useState("");
  const [issues, setIssues] = useState<GrammarIssue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function check(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isChecking) return;
    if (!sentence.trim()) {
      setError(t.empty);
      return;
    }

    setIsChecking(true);
    setError(null);
    setIssues(null);
    try {
      const result = await checkSentenceAction({ sentence });
      if (result.success) setIssues(result.issues);
      else
        setError(
          result.error === "rate_limited"
            ? t.rateLimited
            : result.error === "not_signed_in"
              ? common.sessionEnded
              : result.error === "invalid_data"
                ? t.empty
                : t.failed,
        );
    } catch {
      setError(t.failed);
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <section aria-labelledby="sentence-check-title" className="border-[3px] border-line bg-raised p-5 shadow-brutal sm:p-7">
      <h2 id="sentence-check-title" className="text-sm font-black tracking-widest uppercase">
        {t.title}
      </h2>
      <form onSubmit={check} className="mt-4">
        <Label htmlFor="sentence-check-input">
          {t.prompt} <span lang="en">{lemma}</span>
        </Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="sentence-check-input"
            lang="en"
            autoComplete="off"
            spellCheck={false}
            maxLength={MAX_SENTENCE_LENGTH}
            value={sentence}
            onChange={(event) => {
              setSentence(event.target.value);
              setIssues(null);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "sentence-check-error" : undefined}
            className="flex-1"
          />
          <Button type="submit" aria-disabled={isChecking}>
            {isChecking ? t.checking : t.check}
          </Button>
        </div>
      </form>

      <div aria-live="polite" className="mt-4 empty:hidden">
        {error && (
          <p id="sentence-check-error" role="alert" className="border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
            {error}
          </p>
        )}
        {issues?.length === 0 && (
          <p className="flex items-center gap-2 border-[3px] border-line bg-box-4 p-3 font-black text-on-box">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> {t.noMistakes}
          </p>
        )}
        {issues && issues.length > 0 && (
          <ul className="space-y-3">
            {issues.map((issue, i) => (
              <li key={i} className="border-[2px] border-line bg-surface p-4">
                <p lang="en" className="font-display text-lg font-black break-words">
                  <s className="decoration-mark decoration-[3px]">{issue.fragment}</s>
                  {issue.suggestions.length > 0 && <> → {issue.suggestions.join(" / ")}</>}
                </p>
                <p lang="en" className="mt-1 text-sm font-semibold text-muted">
                  {issue.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs font-semibold text-muted">{t.credit}</p>
    </section>
  );
}
