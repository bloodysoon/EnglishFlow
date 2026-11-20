"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";

import { Button, buttonClasses } from "@/components/ui/button";
import { fill, type Locale } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { forgetKnownWordAction } from "@/features/learning/actions/word-list.actions";
import type { WordCard } from "@/features/learning/queries";

// Quiz on known words: "Knew it" changes nothing, "Forgot" moves the word
// into today's reviews. No XP, so the quiz cannot be farmed.
export function KnownQuiz({
  cards,
  language,
  locale,
  nextRoundHref,
  t,
  sessionEnded,
}: {
  cards: WordCard[];
  language: "ru" | "ro" | "id";
  locale: Locale;
  nextRoundHref: string;
  t: PlatformDictionary["quiz"];
  sessionEnded: string;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [forgotten, setForgotten] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (cards.length === 0) {
    return <p className="max-w-xl border-[3px] border-line bg-surface p-5 font-semibold shadow-brutal-md">{t.empty}</p>;
  }

  const card = cards[index];

  async function answer(knew: boolean) {
    if (!card || pending) return;
    if (!knew) {
      setPending(true);
      setError(null);
      try {
        const result = await forgetKnownWordAction({ wordId: card.wordId });
        if (!result.success) {
          setError(result.error === "not_signed_in" ? sessionEnded : t.failed);
          return;
        }
        setForgotten((n) => n + 1);
      } catch {
        setError(t.failed);
        return;
      } finally {
        setPending(false);
      }
    }
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (!card) {
    return (
      <section className="card-in max-w-xl border-[3px] border-line bg-raised p-6 shadow-brutal sm:p-8">
        <h2 className="font-display text-3xl font-black uppercase">{t.done}</h2>
        <p className="mt-4 text-lg font-black">{fill(t.result, { knew: cards.length - forgotten, total: cards.length })}</p>
        {forgotten > 0 && <p className="mt-2 font-semibold text-muted">{plural(locale, forgotten, t.forgotten)}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={nextRoundHref} className={buttonClasses()}>
            {t.again}
          </Link>
          <Link href="/learn/known" className={buttonClasses({ variant: "secondary" })}>
            {t.back}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-5 flex items-center gap-4">
        <p className="shrink-0 text-sm font-black tracking-wide uppercase">
          {fill(t.wordOf, { current: index + 1, total: cards.length })}
        </p>
        <div aria-hidden="true" className="h-3 flex-1 overflow-hidden border-[3px] border-line bg-raised">
          <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${(index / cards.length) * 100}%` }} />
        </div>
      </div>

      <div key={card.wordId} className="card-in border-[3px] border-line bg-raised p-6 shadow-brutal">
        <div lang="en">
          <p className="font-display text-[clamp(2rem,9vw,3.25rem)] leading-none font-black tracking-tight break-words">
            {card.lemma}
          </p>
          <p className="mt-2 font-bold text-muted">{[card.ipa, card.partOfSpeech].filter(Boolean).join(" · ")}</p>
        </div>

        <div className="mt-6 min-h-16">
          {revealed ? (
            <p lang={language} className="font-display text-2xl font-black">
              {card.translation ?? "—"}
              {card.alternatives.length > 0 && (
                <span className="font-sans text-base font-semibold text-muted">, {card.alternatives.join(", ")}</span>
              )}
            </p>
          ) : (
            <p className="text-sm font-black uppercase">{t.question}</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {revealed ? (
          <>
            <Button variant="secondary" onClick={() => void answer(false)} aria-disabled={pending} className="w-full px-3!">
              <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
              {t.forgot}
            </Button>
            <Button onClick={() => void answer(true)} aria-disabled={pending} className="w-full px-3!">
              <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
              {t.knew}
            </Button>
          </>
        ) : (
          <Button onClick={() => setRevealed(true)} className="col-span-2 w-full">
            {t.show}
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
          {error}
        </p>
      )}
    </div>
  );
}
