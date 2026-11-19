"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { fill, type Locale } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { checkSentenceAction } from "@/features/writing/actions/check-sentence.action";
import { MAX_SENTENCE_LENGTH } from "@/features/writing/grammar-check";
import { masteredTenses, type PracticeEntry } from "@/features/writing/history";
import { TENSE_INFO, TENSES, tenseSchema, type Tense } from "@/features/writing/tenses";
import { containsWord } from "@/features/writing/word-forms";

type T = PlatformDictionary["sentenceCheck"];
type Common = PlatformDictionary["common"];

type Props = {
  wordId: string;
  lemma: string;
  history: PracticeEntry[];
  locale: Locale;
  // BCP 47 tag for dates, e.g. "ru-RU".
  dateTag: string;
  t: T;
  common: Common;
};

// Practice box: the learner writes a sentence with the word, optionally in a chosen tense.
// LanguageTool marks the mistakes, our rules check the tense, and every check is saved.
export function SentenceCheck({ wordId, lemma, history: initialHistory, locale, dateTag, t, common }: Props) {
  const [sentence, setSentence] = useState("");
  const [tense, setTense] = useState<Tense | null>(null);
  const [result, setResult] = useState<{ entry: PracticeEntry; detected: Tense[] } | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  const mastered = masteredTenses(history);
  // UTC like the rest of the word page, so server and browser render the same text.
  const date = new Intl.DateTimeFormat(dateTag, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

  async function check(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isChecking) return;
    if (!sentence.trim()) {
      setError(t.empty);
      return;
    }
    // Instant hint; the server checks again.
    if (!containsWord(sentence, lemma)) {
      setError(fill(t.missingWord, { word: lemma }));
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);
    try {
      const response = await checkSentenceAction({ sentence, wordId, tense });
      if (response.success) {
        setResult(response);
        setHistory((entries) => [response.entry, ...entries]);
        // The word timeline below is server-rendered; reload it with the new sentence.
        router.refresh();
      } else
        setError(
          response.error === "rate_limited"
            ? t.rateLimited
            : response.error === "missing_word"
              ? fill(t.missingWord, { word: lemma })
              : response.error === "not_signed_in"
              ? common.sessionEnded
              : response.error === "invalid_data"
                ? t.empty
                : t.failed,
        );
    } catch {
      setError(t.failed);
    } finally {
      setIsChecking(false);
    }
  }

  const entry = result?.entry;
  const names = (tenses: Tense[]) => tenses.map((x) => TENSE_INFO[x].name).join(", ");

  return (
    <section aria-labelledby="sentence-check-title" className="border-[3px] border-line bg-raised p-5 shadow-brutal sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sentence-check-title" className="text-sm font-black tracking-widest uppercase">
          {t.title}
        </h2>
        <p className="text-xs font-bold text-muted uppercase">
          {fill(t.tensesDone, { n: mastered.size, total: TENSES.length })}
        </p>
      </div>

      <div className="mt-4">
        <Label htmlFor="sentence-check-mode">{t.mode}</Label>
        <select
          id="sentence-check-mode"
          value={tense ?? ""}
          onChange={(event) => {
            setTense(tenseSchema.nullable().catch(null).parse(event.target.value || null));
            setResult(null);
            setError(null);
          }}
          className="min-h-12 w-full border-[3px] border-line bg-raised p-3 font-semibold text-fg"
        >
          <option value="">{t.free}</option>
          {TENSES.map((value) => (
            <option key={value} value={value}>
              {mastered.has(value) ? "✓ " : ""}
              {TENSE_INFO[value].name}
            </option>
          ))}
        </select>
        {tense && (
          <dl lang="en" className="mt-3 grid gap-1 border-[2px] border-line bg-surface p-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
            <dt className="font-black uppercase" lang={locale}>{t.formula}</dt>
            <dd className="font-display font-black">{TENSE_INFO[tense].formula}</dd>
            <dt className="font-black uppercase" lang={locale}>{t.example}</dt>
            <dd className="font-semibold">{TENSE_INFO[tense].example}</dd>
          </dl>
        )}
      </div>

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
              setResult(null);
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

      <div aria-live="polite" className="mt-4 space-y-3 empty:hidden">
        {error && (
          <p id="sentence-check-error" role="alert" className="border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
            {error}
          </p>
        )}
        {entry?.tense && result && (
          <div className={`border-[3px] border-line p-3 font-semibold text-on-box ${entry.tenseOk ? "bg-box-4" : "bg-box-2"}`}>
            <p className="flex items-center gap-2 font-black">
              {entry.tenseOk ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              {fill(entry.tenseOk ? t.tenseOk : t.tenseWrong, { tense: TENSE_INFO[entry.tense].name })}
            </p>
            {!entry.tenseOk && (
              <p className="mt-1 text-sm">
                {result.detected.length > 0 ? fill(t.found, { tenses: names(result.detected) }) : t.noVerb}
              </p>
            )}
            <p className="mt-1 text-xs">{t.tenseHint}</p>
          </div>
        )}
        {entry?.issues.length === 0 && (
          <p className="flex items-center gap-2 border-[3px] border-line bg-box-4 p-3 font-black text-on-box">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> {t.noMistakes}
          </p>
        )}
        {entry && entry.issues.length > 0 && (
          <ul className="space-y-3">
            {entry.issues.map((issue, i) => (
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

      <h3 className="mt-6 border-t-[2px] border-line pt-4 text-sm font-black tracking-widest uppercase">{t.history}</h3>
      {history.length === 0 ? (
        <p className="mt-2 text-sm font-semibold text-muted">{t.noHistory}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {history.map((item) => (
            <li key={item.id} className="border-[2px] border-line bg-surface p-3">
              <p lang="en" className="font-semibold break-words">
                {item.sentence}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                {item.tense && (
                  <span className={`border-2 border-line px-2 py-0.5 text-on-box uppercase ${item.tenseOk ? "bg-box-4" : "bg-box-2"}`}>
                    {item.tenseOk ? "✓" : "✗"} <span lang="en">{TENSE_INFO[item.tense].name}</span>
                  </span>
                )}
                <span className="uppercase">
                  {item.issues.length === 0 ? t.clean : plural(locale, item.issues.length, t.mistakes)}
                </span>
                <time dateTime={item.at} className="text-muted">
                  {date.format(new Date(item.at))}
                </time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
