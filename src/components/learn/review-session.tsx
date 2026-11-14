"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { Button, buttonClasses } from "@/components/ui/button";
import { reviewWordAction } from "@/features/learning/actions/review-word.action";
import type { ReviewCard } from "@/features/learning/queries";
import { LAST_BOX } from "@/features/leitner/boxes";

type Answer = { wordId: string; lemma: string; remembered: boolean; xp: number; newBox: number; mastered: boolean };

const LANGUAGE_NAMES = { ru: "Русский", ro: "Română" } as const;

export function ReviewSession({ cards, language }: { cards: ReviewCard[]; language: "ru" | "ro" }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(0);

  const revealRef = useRef<HTMLButtonElement>(null);
  const gotItRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const interacted = useRef(false);

  const done = index >= cards.length;
  const card = done ? null : cards[index];
  const last = answers.at(-1);
  const xpEarned = answers.reduce((sum, a) => sum + a.xp, 0);

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
            { wordId: card.wordId, lemma: card.lemma, remembered, xp: result.xp, newBox: result.newBox, mastered: result.mastered },
          ]);
        } else if (result.error === "not_due" || result.error === "not_found") {
          // Answered elsewhere (another tab) or removed: just move on.
          setSkipped((n) => n + 1);
        } else {
          setError(
            result.error === "not_signed_in"
              ? "Your session has ended. Please log in again."
              : "That answer was not saved. Please try again.",
          );
          return;
        }
        setRevealed(false);
        setIndex((i) => i + 1);
      } catch {
        setError("That answer was not saved. Check your connection and try again.");
      } finally {
        setPending(false);
      }
    },
    [card, pending],
  );

  // Space/Enter shows the translation; 1/← forgot, 2/→ got it.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (done || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (!revealed && event.key === " " && target?.tagName !== "BUTTON") {
        event.preventDefault();
        reveal();
      } else if (revealed && (event.key === "1" || event.key === "ArrowLeft")) {
        event.preventDefault();
        void answer(false);
      } else if (revealed && (event.key === "2" || event.key === "ArrowRight")) {
        event.preventDefault();
        void answer(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, revealed, reveal, answer]);

  if (done) {
    const remembered = answers.filter((a) => a.remembered).length;
    const mastered = answers.filter((a) => a.mastered).length;

    return (
      <section className="card-in max-w-xl border-[3px] border-line bg-raised p-6 text-fg shadow-brutal sm:p-8">
        <h2 ref={doneRef} tabIndex={-1} className="font-display text-3xl font-black uppercase focus:outline-none">
          Review done ✓
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Words", answers.length],
            ["Got it", remembered],
            ["Mastered", mastered],
            ["XP", `+${xpEarned}`],
          ].map(([label, value]) => (
            <div key={label} className="border-[2px] border-line bg-surface px-3 py-2">
              <dt className="text-xs font-black text-muted uppercase">{label}</dt>
              <dd className="font-display text-2xl font-black">{value}</dd>
            </div>
          ))}
        </dl>
        {skipped > 0 && (
          <p className="mt-4 text-sm font-semibold text-muted">
            {skipped} {skipped === 1 ? "word was" : "words were"} already reviewed elsewhere and skipped.
          </p>
        )}
        <p className="mt-4 font-semibold text-muted">
          Each word comes back on its own schedule. See you tomorrow!
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className={buttonClasses()}>
            Go to dashboard
          </Link>
          <Link href="/learn" className={buttonClasses({ variant: "secondary" })}>
            Word sets
          </Link>
        </div>
      </section>
    );
  }

  if (!card) return null;

  return (
    <div className="max-w-xl">
      {/* Progress */}
      <div className="mb-5 flex items-center gap-4">
        <p className="shrink-0 text-sm font-black tracking-wide uppercase">
          Word {index + 1} of {cards.length}
        </p>
        <div
          role="progressbar"
          aria-label="Review progress"
          aria-valuemin={0}
          aria-valuemax={cards.length}
          aria-valuenow={index}
          className="h-3 flex-1 overflow-hidden border-[3px] border-line bg-raised"
        >
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${(index / cards.length) * 100}%` }}
          />
        </div>
        <p className="shrink-0 font-display text-sm font-black">+{xpEarned} XP</p>
      </div>

      {/* The card */}
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 border-[3px] border-line bg-box-4" />
        <div key={card.wordId} className="card-in relative [perspective:1400px]">
          <div
            className="relative h-[300px] transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] [transform-style:preserve-3d] motion-reduce:transition-none sm:h-[320px]"
            style={{ transform: revealed ? "rotateY(180deg)" : "none" }}
          >
            <div
              className="flip-face absolute inset-0 flex flex-col justify-between border-[3px] border-line bg-raised p-6 text-fg shadow-brutal"
              aria-hidden={revealed}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`border-2 border-line px-2 py-1 text-xs font-black uppercase ${leitnerBoxStyles[card.box]}`}>
                  Box {card.box}
                </span>
                {card.level && <span className="border-2 border-line px-2 py-1 text-xs font-black">{card.level}</span>}
              </div>
              <div lang="en">
                <p className="font-display text-[clamp(2.25rem,9vw,3.5rem)] leading-none font-black tracking-tight break-words">
                  {card.lemma}
                </p>
                <p className="mt-3 font-bold text-muted">
                  {[card.ipa, card.partOfSpeech].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-sm font-black uppercase">Do you know the translation?</p>
            </div>

            <div
              className="flip-face flip-face--back absolute inset-0 flex flex-col justify-center gap-3 border-[3px] border-line bg-box-3 p-6 text-on-box-3 shadow-brutal"
              aria-hidden={!revealed}
            >
              <p className="text-xs font-black tracking-widest uppercase">
                <span lang="en">{card.lemma}</span> · {LANGUAGE_NAMES[language]}
              </p>
              {card.translation ? (
                <div lang={language}>
                  <p className="font-display text-[clamp(1.75rem,7vw,2.5rem)] leading-tight font-black break-words">
                    {card.translation}
                  </p>
                  {card.alternatives.length > 0 && (
                    <p className="mt-1 font-semibold">{card.alternatives.join(", ")}</p>
                  )}
                </div>
              ) : (
                <p className="font-black">No checked translation yet. Did you know the meaning?</p>
              )}
              {card.example && (
                <p lang="en" className="font-semibold italic">
                  &ldquo;{card.example}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 grid min-h-[60px] grid-cols-2 gap-3">
        {revealed ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void answer(false)}
              aria-disabled={pending}
              className="w-full px-3!"
            >
              <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
              Forgot
            </Button>
            <Button
              ref={gotItRef}
              type="button"
              onClick={() => void answer(true)}
              aria-disabled={pending}
              className="w-full px-3!"
            >
              <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
              Got it
            </Button>
          </>
        ) : (
          <Button ref={revealRef} type="button" onClick={reveal} className="col-span-2 w-full">
            Show translation
          </Button>
        )}
      </div>

      <p className="mt-3 hidden text-xs font-semibold text-muted sm:block">
        Keyboard: Space shows the translation · 1 or ← forgot · 2 or → got it
      </p>

      {error && (
        <p role="alert" className="mt-4 border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
          {error}
        </p>
      )}

      {/* Result of the last answer, announced to screen readers. */}
      <p aria-live="polite" className="mt-4 min-h-6 font-black">
        {last &&
          (last.mastered
            ? `${last.lemma}: mastered! +${last.xp} XP`
            : last.remembered
              ? `${last.lemma} → box ${last.newBox}${last.newBox === LAST_BOX ? " (mastered)" : ""} · +${last.xp} XP`
              : `${last.lemma} → back to box 1 · +${last.xp} XP`)}
      </p>
    </div>
  );
}
