"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Plus, Sparkles, Undo2 } from "lucide-react";

import { countInSession } from "@/components/learn/learn-session";
import { WordExample, WordHead, WordTranslation, speak } from "@/components/learn/word-card";
import { Button } from "@/components/ui/button";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import {
  pickNewWordsAction,
  removeMyWordAction,
  triageWordAction,
} from "@/features/learning/actions/word-list.actions";
import type { CardFilters, TriageCard } from "@/features/learning/queries";

// The last card that left the pile, kept so it can come back (undo).
// wordId is the saved word to remove; null for a skipped card.
type LastMove = { card: TriageCard; wordId: string | null; known: boolean | null };

const quiet =
  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

// One random dictionary word at a time: "I know it" keeps it as known,
// "Learn it" puts it in today's reviews (within the plan's daily limit).
// Keys: ← know, → learn, Space translation, S skip, Z undo, P pronounce.
export function WordTriage({
  initialCards,
  filters,
  language,
  learnedToday,
  limit,
  t,
  autoLabel,
  sessionEnded,
}: {
  initialCards: TriageCard[];
  filters: CardFilters;
  language: "ru" | "ro";
  learnedToday: number;
  limit: number | null; // null = unlimited
  t: PlatformDictionary["triage"];
  autoLabel: string;
  sessionEnded: string;
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [learned, setLearned] = useState(learnedToday);
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Starts at the Settings language; switching here only changes what this card shows.
  const [shownLanguage, setShownLanguage] = useState(language);
  const [last, setLast] = useState<LastMove | null>(null);

  const card = cards[0];
  const translation = card?.translations[shownLanguage] ?? null;
  const translatedDefinition = card?.definitions[shownLanguage] ?? null;
  const limitReached = limit !== null && learned >= limit;

  // Drop the top card; top up before the pile runs out, skipping words already on screen.
  async function advance(current: TriageCard) {
    let rest = cards.slice(1);
    if (rest.length < 2) {
      const more = await pickNewWordsAction(filters);
      if (more.success) {
        const seen = new Set([current.lemma, ...rest.map((c) => c.lemma)]);
        rest = [...rest, ...more.cards.filter((c) => !seen.has(c.lemma))];
      }
    }
    setCards(rest);
    setRevealed(false);
  }

  async function answer(known: boolean) {
    if (!card || pending || (!known && limitReached)) return;
    setPending(true);
    setError(null);
    try {
      const result = await triageWordAction({
        wordId: card.wordId,
        lemma: card.lemma,
        partOfSpeech: card.partOfSpeech,
        known,
      });
      if (!result.success) {
        if (result.error === "daily_limit") setLearned(limit ?? learned);
        else setError(result.error === "not_signed_in" ? sessionEnded : t.failed);
        return;
      }
      if (!known) setLearned((n) => n + 1);
      setLast({ card, wordId: result.wordId, known });
      countInSession(known, 1);
      await advance(card);
      router.refresh();
    } catch {
      setError(t.failed);
    } finally {
      setPending(false);
    }
  }

  // Next word, without marking this one as known or to learn.
  async function skip() {
    if (!card || pending) return;
    setPending(true);
    setError(null);
    try {
      setLast({ card, wordId: null, known: null });
      countInSession(null, 1);
      await advance(card);
    } catch {
      setError(t.failed);
    } finally {
      setPending(false);
    }
  }

  // Take back the last answer (or skip): the saved word is removed and its card returns.
  async function undo() {
    if (!last || pending) return;
    setPending(true);
    setError(null);
    try {
      if (last.wordId) {
        const result = await removeMyWordAction({ wordId: last.wordId });
        if (!result.success) {
          setError(result.error === "not_signed_in" ? sessionEnded : t.failed);
          return;
        }
        if (last.known === false) setLearned((n) => Math.max(0, n - 1));
        router.refresh();
      }
      countInSession(last.known, -1);
      setCards((pile) => [last.card, ...pile.filter((c) => c.lemma !== last.card.lemma)]);
      setRevealed(false);
      setLast(null);
    } catch {
      setError(t.failed);
    } finally {
      setPending(false);
    }
  }

  // Re-bound every render so the handlers always see the current card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      // Not while the tour or the filter panel is open.
      if (document.querySelector("[aria-modal='true'], details[open]")) return;
      const key = e.key.toLowerCase();
      // Space on a focused button or link keeps its normal job.
      if (key === " " && target?.closest("button, a, summary")) return;
      const actions: Record<string, () => void> = {
        arrowleft: () => void answer(true),
        arrowright: () => void answer(false),
        " ": () => setRevealed(true),
        s: () => void skip(),
        z: () => void undo(),
        p: () => card && speak(card.lemma),
      };
      const action = actions[key];
      if (!action) return;
      e.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const undoButton = last && (
    <button type="button" onClick={() => void undo()} aria-disabled={pending} aria-keyshortcuts="Z" className={quiet}>
      <Undo2 className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      {t.undo}
    </button>
  );

  if (!card) {
    return (
      <div>
        <p className="flex items-center gap-3 border-[3px] border-dashed border-line p-5 font-black">
          <Sparkles className="h-6 w-6 shrink-0" aria-hidden="true" />
          {filters.topics.length + filters.partsOfSpeech.length > 0 ? t.noMatch : t.allSeen}
        </p>
        {undoButton}
        {error && (
          <p role="alert" className="mt-3 border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div key={card.lemma} className="card-in border-[3px] border-line bg-raised p-5 shadow-brutal sm:p-7">
        <WordHead
          lemma={card.lemma}
          ipa={card.ipa}
          partOfSpeech={card.partOfSpeech}
          language={shownLanguage}
          onLanguage={setShownLanguage}
          listenLabel={t.listen}
          translateLabel={t.translateTo}
        >
          {card.level && <span className="border-2 border-line px-2 py-0.5 text-xs font-black">{card.level}</span>}
        </WordHead>

        {(translatedDefinition ?? card.definition) && (
          <p lang={translatedDefinition ? shownLanguage : "en"} className="mt-4 font-semibold">
            {translatedDefinition ?? card.definition}
          </p>
        )}

        {card.example && <WordExample example={card.example} lemma={card.lemma} label={t.example} />}

        <div className="mt-4 min-h-12">
          {revealed ? (
            <WordTranslation translation={translation} language={shownLanguage} autoLabel={autoLabel} />
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              aria-keyshortcuts="Space"
              className="min-h-11 cursor-pointer text-sm font-black uppercase underline decoration-[3px] underline-offset-4 hover:decoration-mark"
            >
              {t.show}
            </button>
          )}
        </div>

        <p className="mt-4 border-t-[2px] border-line pt-4 text-sm font-black uppercase">{t.question}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => void answer(true)}
            aria-disabled={pending}
            aria-keyshortcuts="ArrowLeft"
            className="w-full flex-col gap-1! px-3!"
          >
            {/* Phones: icon above the label, which then fits one line. */}
            <span className="flex flex-col items-center gap-1 whitespace-nowrap sm:flex-row sm:gap-2">
              <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
              {t.know}
            </span>
            {/* Key hint, for pointer-and-keyboard screens only. */}
            <ArrowLeft className="hidden h-4 w-4 opacity-70 lg:block" strokeWidth={2.5} aria-hidden="true" />
          </Button>
          <Button
            onClick={() => void answer(false)}
            aria-disabled={pending || limitReached}
            aria-keyshortcuts="ArrowRight"
            className="w-full flex-col gap-1! px-3!"
          >
            <span className="flex flex-col items-center gap-1 whitespace-nowrap sm:flex-row sm:gap-2">
              <Plus className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
              {t.learn}
            </span>
            <ArrowRight className="hidden h-4 w-4 opacity-70 lg:block" strokeWidth={2.5} aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          {/* Keeps "Skip" on the right when there is nothing to undo. */}
          {undoButton || <span />}
          <button
            type="button"
            onClick={() => void skip()}
            aria-disabled={pending}
            aria-keyshortcuts="S"
            className={quiet}
          >
            {t.skip}
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {limitReached && (
          <p className="mt-3 text-sm font-semibold">
            {fill(t.limitReached, { limit: limit ?? 0 })}{" "}
            <Link
              href="/subscription"
              className="font-black underline decoration-2 underline-offset-2 hover:decoration-mark"
            >
              {t.upgrade}
            </Link>
            .
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
