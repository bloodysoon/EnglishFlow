"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";
import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { WordTranslation } from "@/components/landing/word-translation";
import { LEITNER_BOXES, nextBox } from "@/features/leitner/boxes";
import { fill, type TranslationLanguage } from "@/features/i18n/locales";
import type { LandingDictionary } from "@/features/i18n/landing";
import { DEMO_WORDS } from "@/features/i18n/landing/words";

type Move = { word: string; to: number; remembered: boolean; id: number };
type DemoWord = (typeof DEMO_WORDS)[number];

type ReviewDemoProps = {
  isAuthenticated: boolean;
  signUpHref: string;
  dict: LandingDictionary["review"];
  boxLabel: string; // "Box {box}"
  question: string;
  translationLanguages: TranslationLanguage[];
};

// A sample review session. Nothing is saved: it only shows the rule.
export function ReviewDemo({ isAuthenticated, signUpHref, dict, boxLabel, question, translationLanguages }: ReviewDemoProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [boxes, setBoxes] = useState<number[]>(() => DEMO_WORDS.map((w) => w.box));
  const [moves, setMoves] = useState<Move[]>([]);
  // The answered card flying off toward its new box (animation only).
  const [leaving, setLeaving] = useState<Move & { index: number } | null>(null);

  const revealRef = useRef<HTMLButtonElement>(null);
  const gotItRef = useRef<HTMLButtonElement>(null);
  const restartRef = useRef<HTMLButtonElement>(null);
  // Move focus only after the visitor acts, never on first render.
  const interacted = useRef(false);

  const done = index >= DEMO_WORDS.length;
  const current = done ? null : DEMO_WORDS[index];
  const lastMove = moves.at(-1);
  const movedUp = moves.filter((m) => m.remembered).length;

  useEffect(() => {
    if (!interacted.current) return;
    // The next control takes the same slot, so it is already in view: scrolling
    // to it would only push the card's top under the sticky header.
    const options = { preventScroll: true };
    if (done) restartRef.current?.focus(options);
    else if (revealed) gotItRef.current?.focus(options);
    else revealRef.current?.focus(options);
  }, [done, revealed, index]);

  function reveal() {
    interacted.current = true;
    setRevealed(true);
  }

  function answer(remembered: boolean) {
    const to = nextBox(boxes[index], remembered);
    const move = { word: DEMO_WORDS[index].word, to, remembered, id: moves.length };

    // Reduced motion: no animation would run to remove the copy, so skip it.
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setLeaving({ ...move, index });

    setBoxes((prev) => prev.map((box, i) => (i === index ? to : box)));
    setMoves((prev) => [...prev, move]);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  function restart() {
    interacted.current = true;
    setIndex(0);
    setRevealed(false);
    setBoxes(DEMO_WORDS.map((w) => w.box));
    setMoves([]);
    setLeaving(null);
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      {/* Session header */}
      <div className="mb-5 flex items-center gap-4">
        <p className="shrink-0 text-sm font-black tracking-wide uppercase">
          {done ? dict.done : fill(dict.wordOf, { current: index + 1, total: DEMO_WORDS.length })}
        </p>
        <div aria-hidden="true" className="h-3 flex-1 overflow-hidden border-[3px] border-line bg-raised">
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${(Math.min(index, DEMO_WORDS.length) / DEMO_WORDS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* The card */}
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 border-[3px] border-line bg-box-4" />

        {current ? (
          <div key={index} className="card-in relative [perspective:1400px]">
            <div
              className="relative h-[260px] transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] [transform-style:preserve-3d] motion-reduce:transition-none sm:h-[280px]"
              style={{ transform: revealed ? "rotateY(180deg)" : "none" }}
            >
              <div
                className="flip-face absolute inset-0 flex flex-col justify-between border-[3px] border-line bg-raised p-6 text-fg shadow-brutal"
                aria-hidden={revealed}
              >
                <span
                  className={`self-start border-2 border-line px-2 py-1 text-xs font-black uppercase ${leitnerBoxStyles[boxes[index]]}`}
                >
                  {fill(boxLabel, { box: boxes[index] })}
                </span>
                <div lang="en">
                  <p className="font-display text-[clamp(2.25rem,9vw,3.25rem)] leading-none font-black tracking-tight">
                    {current.word}
                  </p>
                  <p className="mt-3 font-bold text-muted">{current.phonetic}</p>
                </div>
                <p className="text-sm font-black uppercase">{question}</p>
              </div>

              <CardBack
                word={current}
                languages={translationLanguages}
                className="flip-face flip-face--back absolute inset-0"
                aria-hidden={!revealed}
              />
            </div>
          </div>
        ) : (
          <div className="card-in relative flex h-[260px] flex-col justify-center gap-3 border-[3px] border-line bg-raised p-6 text-fg shadow-brutal sm:h-[280px]">
            <p className="font-display text-3xl font-black uppercase">{dict.doneTitle}</p>
            <p className="font-semibold text-muted">
              {fill(dict.summary, { up: movedUp, back: moves.length - movedUp })}
            </p>
          </div>
        )}

        {leaving && (
          <CardBack
            key={leaving.id}
            word={DEMO_WORDS[leaving.index]}
            languages={translationLanguages}
            aria-hidden="true"
            className={`${leaving.remembered ? "card-out--up" : "card-out--back"} pointer-events-none absolute inset-0 z-10`}
            onAnimationEnd={() => setLeaving(null)}
          />
        )}
      </div>

      {/* Controls: always the same slot, so the layout never jumps. */}
      <div className="mt-8 grid min-h-[60px] grid-cols-2 gap-3">
        {done ? (
          <>
            <button
              ref={restartRef}
              type="button"
              onClick={restart}
              className={buttonClasses({ variant: "secondary", className: "w-full px-3!" })}
            >
              {dict.tryAgain}
            </button>
            <Link
              href={isAuthenticated ? "/dashboard" : signUpHref}
              className={buttonClasses({ variant: "primary", className: "w-full px-3!" })}
            >
              {isAuthenticated ? dict.yourWords : dict.signUp}
            </Link>
          </>
        ) : revealed ? (
          <>
            <button
              type="button"
              onClick={() => answer(false)}
              className={buttonClasses({ variant: "secondary", className: "w-full px-3!" })}
            >
              <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
              {dict.forgot}
            </button>
            <button
              ref={gotItRef}
              type="button"
              onClick={() => answer(true)}
              className={buttonClasses({ variant: "primary", className: "w-full px-3!" })}
            >
              <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
              {dict.gotIt}
            </button>
          </>
        ) : (
          <button
            ref={revealRef}
            type="button"
            onClick={reveal}
            className={buttonClasses({ variant: "primary", className: "col-span-2 w-full" })}
          >
            {dict.showTranslation}
          </button>
        )}
      </div>

      {/* Where the words sit now */}
      <ol aria-label={dict.perBox} className="mt-8 grid grid-cols-5 gap-2 sm:gap-3">
        {LEITNER_BOXES.map(({ box }) => {
          const count = boxes.filter((b) => b === box).length;
          const justLanded = lastMove?.to === box;

          return (
            <li
              key={box}
              className={`flex flex-col items-center border-[3px] border-line py-2 shadow-brutal-sm ${leitnerBoxStyles[box]}`}
            >
              {/* Phones show only the number: the colour marks the box. */}
              <span className="text-xs font-black tracking-wider uppercase">
                <span className="hidden sm:inline">{fill(boxLabel, { box })}</span>
                <span className="sm:hidden" aria-hidden="true">{box}</span>
                <span className="sr-only sm:hidden">{fill(boxLabel, { box })}</span>
              </span>
              <span
                key={justLanded ? `landed-${lastMove.id}` : "idle"}
                className={`font-display text-2xl font-black ${justLanded ? "chip-pop" : ""}`}
              >
                <span aria-hidden="true">{count}</span>
                <span className="sr-only">{fill(dict.wordCount, { count })}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <p aria-live="polite" className="sr-only">
        {lastMove
          ? lastMove.remembered
            ? fill(dict.liveMoved, { word: lastMove.word, box: lastMove.to })
            : fill(dict.liveBack, { word: lastMove.word })
          : ""}
      </p>
    </div>
  );
}

// Answer side of a demo card: in the flip, and as the copy that flies off.
function CardBack({
  word,
  languages,
  className = "",
  ...props
}: { word: DemoWord; languages: TranslationLanguage[] } & ComponentProps<"div">) {
  return (
    <div
      className={`flex flex-col justify-center gap-3 border-[3px] border-line bg-box-3 p-6 text-on-box-3 shadow-brutal ${className}`}
      {...props}
    >
      <p lang="en" className="text-xs font-black tracking-widest uppercase">
        {word.word}
      </p>
      <WordTranslation
        word={word}
        languages={languages}
        className="font-display text-[clamp(1.6rem,6vw,2.25rem)] leading-tight font-black"
      />
      <p lang="en" className="font-semibold italic">
        &ldquo;{word.example}&rdquo;
      </p>
    </div>
  );
}
