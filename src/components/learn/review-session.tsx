"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronRight, PartyPopper, RotateCcw, TrendingUp, X } from "lucide-react";
import { createPortal } from "react-dom";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { Collapsible, HideButton, useHidden } from "@/components/learn/learn-panels";
import { WordExample, WordHead, WordTranslation, speak, wordBadge } from "@/components/learn/word-card";
import { Button, buttonClasses } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { fill, type Locale } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { reviewWordAction } from "@/features/learning/actions/review-word.action";
import type { ReviewCard } from "@/features/learning/queries";
import { LAST_BOX } from "@/features/leitner/boxes";
import { learnerLevel } from "@/features/leitner/xp";
import { levelTitle } from "@/features/rewards/levels";

type Answer = { wordId: string; lemma: string; remembered: boolean; xp: number; newBox: number; mastered: boolean };

// The header slot never moves, so nothing to listen to.
const noSubscribe = () => () => {};

export function ReviewSession({
  cards,
  language,
  locale,
  t,
  c,
  sessionEnded,
  startXp,
  rewards,
  panelLabels,
}: {
  cards: ReviewCard[];
  language: "ru" | "ro" | "id";
  locale: Locale;
  t: PlatformDictionary["review"];
  c: PlatformDictionary["triage"]; // labels shared with the Learn card
  sessionEnded: string;
  // XP before this session, to notice a level-up as it happens.
  startXp: number;
  rewards: PlatformDictionary["rewards"];
  panelLabels: PlatformDictionary["learn"]; // hide / show panel
}) {
  const { hidden, toggle } = useHidden();
  const panelHidden = hidden.includes("review");
  // The page header's slot for the chip of the hidden panel (none on the server).
  const chipSlot = useSyncExternalStore(noSubscribe, () => document.getElementById("review-chips"), () => null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [closedLevel, setClosedLevel] = useState<number | null>(null);
  // Starts at the Settings language; switching here only changes what the card shows.
  const [shownLanguage, setShownLanguage] = useState(language);

  const revealRef = useRef<HTMLButtonElement>(null);
  const gotItRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const interacted = useRef(false);

  const done = index >= cards.length;
  const card = done ? null : cards[index];
  const last = answers.at(-1);
  const xpEarned = answers.reduce((sum, a) => sum + a.xp, 0);
  const startLevel = learnerLevel(startXp).level;
  const nowLevel = learnerLevel(startXp + xpEarned).level;
  // Pop-up at the top centre until closed; a further level-up shows it again.
  // Portalled to <body>: animated (transformed) parents would trap position: fixed.
  const levelUp =
    nowLevel > startLevel && closedLevel !== nowLevel
      ? createPortal(
          <div
            role="status"
            className="stamp fixed inset-x-0 top-[calc(--spacing(4)+env(safe-area-inset-top))] z-[80] mx-auto flex w-[min(28rem,calc(100vw-2rem))] items-center gap-3 border-[3px] border-line bg-medal-gold p-3 font-black text-on-box shadow-brutal"
          >
            <PartyPopper className="h-7 w-7 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block uppercase">{rewards.levelUp}</span>
              <span className="block text-sm">
                {fill(rewards.levelReached, { level: nowLevel, title: rewards.titles[levelTitle(nowLevel).id] })}
              </span>
            </span>
            <button
              type="button"
              aria-label={rewards.close}
              onClick={() => setClosedLevel(nowLevel)}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border-[2px] border-line bg-raised text-fg shadow-brutal-sm hover:bg-box-2 hover:text-on-box"
            >
              <X className="h-5 w-5" strokeWidth={2.75} aria-hidden="true" />
            </button>
          </div>,
          document.body,
        )
      : null;

  // Keep keyboard focus on the control that matters next.
  useEffect(() => {
    if (!interacted.current) return;
    if (done) doneRef.current?.focus();
    else if (revealed) gotItRef.current?.focus();
    else revealRef.current?.focus();
  }, [done, revealed, index]);

  const reveal = useCallback(() => {
    interacted.current = true;
    setRevealed(true);
  }, []);

  const answer = useCallback(
    async (remembered: boolean) => {
      if (!card || pending) return;
      interacted.current = true;
      setPending(true);
      setError(null);
      try {
        const result = await reviewWordAction({ wordId: card.wordId, remembered });
        if (result.success) {
          setAnswers((prev) => [
            ...prev,
            {
              wordId: card.wordId,
              lemma: card.lemma,
              remembered,
              xp: result.xp,
              newBox: result.newBox,
              mastered: result.mastered,
            },
          ]);
        } else if (result.error === "not_due" || result.error === "not_found") {
          // Answered elsewhere (another tab) or removed: just move on.
          setSkipped((n) => n + 1);
        } else {
          setError(result.error === "not_signed_in" ? sessionEnded : t.notSaved);
          return;
        }
        setRevealed(false);
        setIndex((i) => i + 1);
      } catch {
        setError(t.notSavedConnection);
      } finally {
        setPending(false);
      }
    },
    [card, pending, sessionEnded, t],
  );

  // Next word without an answer: it stays due and comes back in the next session.
  const skip = useCallback(() => {
    if (pending) return;
    interacted.current = true;
    setError(null);
    setRevealed(false);
    setIndex((i) => i + 1);
  }, [pending]);

  // Space shows the translation; 1/← got it, 2/→ forgot (same sides as Learn); S skips, P pronounces.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (done || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const key = event.key.toLowerCase();
      if (!event.repeat && (key === "s" || key === "p")) {
        event.preventDefault();
        if (key === "s") skip();
        else if (card) speak(card.lemma);
        return;
      }

      if (!revealed && event.key === " " && target?.tagName !== "BUTTON") {
        event.preventDefault();
        reveal();
      } else if (revealed && (event.key === "1" || event.key === "ArrowLeft")) {
        event.preventDefault();
        void answer(true);
      } else if (revealed && (event.key === "2" || event.key === "ArrowRight")) {
        event.preventDefault();
        void answer(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, revealed, reveal, answer, skip, card]);

  if (done) {
    const remembered = answers.filter((a) => a.remembered).length;
    const mastered = answers.filter((a) => a.mastered).length;

    return (
      <section className="card-in max-w-xl border-[3px] border-line bg-raised p-6 text-fg shadow-brutal sm:p-8">
        <h2 ref={doneRef} tabIndex={-1} className="font-display text-3xl font-black uppercase focus:outline-none">
          {answers.length === 0 ? t.allSkipped : t.done}
        </h2>
        {/* All skipped: no zero stats and no "see you tomorrow" — those words are still due. */}
        {answers.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [t.statWords, answers.length],
            [t.statGotIt, remembered],
            [t.statMastered, mastered],
            [t.statXp, `+${xpEarned}`],
          ].map(([label, value]) => (
            <div key={label} className="border-[2px] border-line bg-surface px-3 py-2">
              <dt className="text-xs font-black text-muted uppercase">{label}</dt>
              <dd className="font-display text-2xl font-black">{value}</dd>
            </div>
          ))}
        </dl>
        )}
        {levelUp}
        {skipped > 0 && <p className="mt-4 text-sm font-semibold text-muted">{plural(locale, skipped, t.skipped)}</p>}
        {answers.length > 0 && <p className="mt-4 font-semibold text-muted">{t.comeBack}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className={buttonClasses()}>
            {t.goDashboard}
          </Link>
          <Link href="/learn/new-words" className={buttonClasses({ variant: "secondary" })}>
            {t.newWords}
          </Link>
        </div>
      </section>
    );
  }

  if (!card) return null;

  const lastText =
    last &&
    (last.mastered
      ? fill(t.lastMastered, { word: last.lemma, xp: last.xp })
      : last.remembered
        ? fill(last.newBox === LAST_BOX ? t.lastUpMastered : t.lastUp, {
            word: last.lemma,
            box: last.newBox,
            xp: last.xp,
          })
        : fill(t.lastBack, { word: last.lemma, xp: last.xp }));
  const translation = card.translations[shownLanguage];
  const translatedDefinition = card.definitions[shownLanguage];

  return (
    <div>
      {/* Progress, in the same box as "Today's learning" on Learn; like it,
          it can fold into a chip in the page header. */}
      {panelHidden &&
        chipSlot &&
        createPortal(
          <button
            type="button"
            onClick={() => toggle("review")}
            aria-label={fill(panelLabels.showPanel, {
              panel: `${fill(t.wordOf, { current: index + 1, total: cards.length })}, +${xpEarned} XP`,
            })}
            title={t.progressAria}
            className={buttonClasses({ size: "toolbar", variant: "secondary", className: "chip-pop gap-1.5" })}
          >
            <TrendingUp className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            <span className="text-xs">
              {index + 1}/{cards.length}
              <span className="text-primary"> +{xpEarned}</span>
            </span>
          </button>,
          chipSlot,
        )}
      <Collapsible open={!panelHidden}>
      <div className="border-[3px] border-line bg-raised p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black tracking-widest uppercase">
            {fill(t.wordOf, { current: index + 1, total: cards.length })}
          </p>
          <div className="flex items-center gap-3">
            <p className="font-display text-xl font-black whitespace-nowrap">+{xpEarned} XP</p>
            <HideButton label={fill(panelLabels.hidePanel, { panel: t.progressAria })} onClick={() => toggle("review")} />
          </div>
        </div>
        <ProgressBar
          label={t.progressAria}
          value={index}
          max={cards.length}
          tone="bg-primary"
          className="mt-3 h-3 border-[2px]"
        />
        {levelUp}
      </div>
      </Collapsible>

      {/* The card: the word first, the answer after "Show translation". */}
      <div key={card.wordId} className="card-in mt-6 border-[3px] border-line bg-raised p-5 shadow-brutal sm:p-7">
        <WordHead
          lemma={card.lemma}
          ipa={card.ipa}
          partOfSpeech={card.partOfSpeech}
          language={shownLanguage}
          onLanguage={revealed ? setShownLanguage : undefined}
          listenLabel={c.listen}
          translateLabel={c.translateTo}
        >
          <span
            className={`${wordBadge} ${leitnerBoxStyles[card.box]}`}
          >
            {fill(t.box, { box: card.box })}
          </span>
          {card.level && <span className={wordBadge}>{card.level}</span>}
        </WordHead>

        {/* Live region exists before the reveal, so screen readers announce the answer while focus moves to the buttons. */}
        <div aria-live="polite">
          {revealed && (
          <div className="mt-4">
            {translation ? (
              <WordTranslation translation={translation} language={shownLanguage} autoLabel={t.auto} />
            ) : (
              <p className="font-black">{t.noChecked}</p>
            )}
            {(translatedDefinition ?? card.definition) && (
              <p lang={translatedDefinition ? shownLanguage : "en"} className="mt-3 font-semibold">
                {translatedDefinition ?? card.definition}
              </p>
            )}
            {card.example && <WordExample example={card.example} lemma={card.lemma} label={c.example} />}
          </div>
          )}
        </div>

        <p className="mt-4 border-t-[2px] border-line pt-4 text-sm font-black uppercase">{t.question}</p>
        <div className="mt-3 grid min-h-[60px] grid-cols-2 gap-3">
          {revealed ? (
            <>
              {/* "Got it" on the left, as "I know it" is on Learn, so ← means the same on both screens. */}
              <Button
                ref={gotItRef}
                type="button"
                onClick={() => void answer(true)}
                aria-disabled={pending}
                aria-keyshortcuts="ArrowLeft 1"
                className="w-full flex-col gap-1! px-3!"
              >
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
                  {t.gotIt}
                </span>
                {/* Key hint, for pointer-and-keyboard screens only. */}
                <ArrowLeft className="hidden h-4 w-4 opacity-70 lg:block" strokeWidth={2.5} aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void answer(false)}
                aria-disabled={pending}
                aria-keyshortcuts="ArrowRight 2"
                className="w-full flex-col gap-1! px-3!"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
                  {t.forgot}
                </span>
                <ArrowRight className="hidden h-4 w-4 opacity-70 lg:block" strokeWidth={2.5} aria-hidden="true" />
              </Button>
            </>
          ) : (
            <Button
              ref={revealRef}
              type="button"
              onClick={reveal}
              aria-keyshortcuts="Space"
              className="col-span-2 w-full"
            >
              {t.show}
            </Button>
          )}
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={skip}
            aria-disabled={pending}
            aria-keyshortcuts="S"
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            {c.skip}
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="mt-3 hidden text-xs font-semibold text-muted sm:block">{t.keyboard}</p>

      {error && (
        <p role="alert" className="mt-4 border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
          {error}
        </p>
      )}

      {/* Result of the last answer, announced to screen readers. */}
      <p aria-live="polite" className="mt-4 min-h-6 font-black">
        {lastText && (
          <>
            <span aria-hidden="true">{lastText}</span>
            {/* Same text without "→" and "·", which screen readers read out as symbols. */}
            <span className="sr-only">{lastText.replace(/\s*[→·]\s*/g, ", ")}</span>
          </>
        )}
      </p>
    </div>
  );
}
