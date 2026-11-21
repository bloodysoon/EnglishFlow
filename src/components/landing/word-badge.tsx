"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { badgeLayer, badgePose } from "@/components/landing/badge-pose";
import { FallText } from "@/components/landing/fall-text";
import { WordTranslation } from "@/components/landing/word-translation";
import { fill } from "@/features/i18n/locales";
import type { LandingDictionary } from "@/features/i18n/landing";
import {
  TRIAGE_WORDS,
  type LandingLanguage,
} from "@/features/i18n/landing/words";

// How each dealt badge was sorted (its stamp): -1 "I know it", 1 "Learn it".
// The last badge stays on the clip.
const SIDES: readonly (-1 | 1)[] = [-1, 1, -1, 1];
const DEALS = SIDES.length;
const TAIL = 0.25; // a little scroll after the last deal, so it settles
const SCROLL_PER_DEAL_VH = 65;
const SMOOTHING = 0.09; // share of the gap closed each frame: lower is lazier

// The new-words step as a deck of word cards, dealt by scrolling: the
// section pins, and each stretch of scroll swings the front card out to the
// right, away from the text, stamped "I know it" or "Learn it", and tucks it
// in at the back. Poses are written straight to the elements every frame, so
// scrolling never re-renders; only the counter does, once per deal.
export function WordBadge({
  t,
  translationLanguages,
  intro,
  wideIntro,
}: {
  t: LandingDictionary["triage"];
  translationLanguages: LandingLanguage[];
  // The heading and lead: scrolled past above the deck on phones, held on
  // screen beside it from lg (two copies, one hidden, so the DOM needn't move).
  intro: ReactNode;
  wideIntro: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stampRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [dealt, setDealt] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!track || !pin) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let target = 0;
    let current = 0;
    let frame = 0;

    function draw(t: number) {
      const time = Math.min(t, DEALS); // the last badge stays on the clip
      const outX = Math.min(480, innerWidth * 0.5);
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const { x, y, rotate, scale } = badgePose(i, time, 1, outX);
        card.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`;
        card.style.zIndex = String(badgeLayer(i, time));
        const stamp = stampRefs.current[i];
        if (stamp)
          stamp.style.opacity = String(
            Math.min(1, Math.max(0, (time - i - 0.08) / 0.2)),
          );
      });
      setDealt(Math.min(DEALS, Math.floor(time + 0.5)));
    }

    function measure() {
      const range = track!.offsetHeight - pin!.offsetHeight;
      const top = parseFloat(getComputedStyle(pin!).top) || 0;
      const progress =
        range > 0 ? (top - track!.getBoundingClientRect().top) / range : 0;
      target = Math.min(1, Math.max(0, progress)) * (DEALS + TAIL);
    }

    // Eases toward the scroll position (a lazy "scrub"), then stops.
    function tick() {
      current = reduce.matches
        ? target
        : current + (target - current) * SMOOTHING;
      if (Math.abs(target - current) < 0.001) current = target;
      draw(current);
      frame = current === target ? 0 : requestAnimationFrame(tick);
    }

    function onScroll() {
      measure();
      if (!frame) frame = requestAnimationFrame(tick);
    }

    measure();
    current = target;
    draw(current);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const sorted = SIDES.slice(0, dealt);
  const known = sorted.filter((side) => side === -1).length;

  return (
    <div className="mx-auto w-full max-w-[1360px]">
      <div className="lg:hidden">{intro}</div>

      <div
        ref={trackRef}
        data-pin-track
        style={{
          height: `calc(100svh - var(--navbar-height) + ${DEALS * SCROLL_PER_DEAL_VH}svh)`,
        }}
      >
        <div
          ref={pinRef}
          data-pin
          className="sticky top-(--navbar-height) flex h-[calc(100svh-var(--navbar-height))] flex-col items-center justify-center py-4 max-lg:pb-28 lg:grid lg:grid-cols-2 lg:gap-16"
        >
          <div className="max-lg:hidden">{wideIntro}</div>

          <div className="flex w-full min-w-0 flex-col items-center">
            {/* For screen readers: the deck as a plain list. */}
            <ul className="sr-only">
              {TRIAGE_WORDS.slice(0, DEALS).map((word, i) => (
                <li key={word.word}>
                  <span lang="en">{word.word}</span> —{" "}
                  {word.translations[translationLanguages[0]]}:{" "}
                  {SIDES[i] === -1 ? t.know : t.learn}
                </li>
              ))}
            </ul>

            <div
              aria-hidden="true"
              className="relative w-full max-w-[460px] pt-6"
            >
              <div className="relative h-[clamp(260px,38svh,330px)]">
                {TRIAGE_WORDS.map((word, i) => (
                  <div
                    key={word.word}
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    style={{ zIndex: 50 - i }}
                    className="absolute inset-0 flex flex-col border-[3px] border-line bg-raised p-5 text-fg shadow-brutal-lg will-change-transform sm:p-7"
                  >
                    {/* Same face as the hero's flashcard: counter chip, then the word. */}
                    <div className="flex items-start justify-between gap-3 text-xs font-black tracking-widest uppercase">
                      <span className="shrink-0 border-2 border-line bg-box-1 px-2 py-1 text-on-box">
                        {i + 1}/{TRIAGE_WORDS.length}
                      </span>
                      <span className="pt-1 text-right text-muted">
                        {/* Only the last card's question stays to fall. */}
                        <FallText
                          text={t.question}
                          place="question"
                          falling={
                            i === TRIAGE_WORDS.length - 1 ? t.falling : []
                          }
                        />
                      </span>
                    </div>

                    <div className="mt-4 flex flex-1 flex-col justify-center">
                      <p
                        lang="en"
                        className="font-display text-[clamp(2.25rem,10vw,3.5rem)] leading-none font-black tracking-tight break-words"
                      >
                        {/* The last card's word falls into the boxes below (FallText). */}
                        <FallText
                          text={word.word}
                          place="card"
                          falling={t.falling}
                          phones
                        />
                      </p>
                      <p lang="en" className="mt-2 font-bold text-muted">
                        {word.phonetic}
                      </p>
                    </div>

                    <div className="border-t-[3px] border-dashed border-line pt-3">
                      <WordTranslation
                        word={word}
                        languages={translationLanguages}
                        className="text-lg font-black"
                      />
                      <p
                        lang="en"
                        className="mt-1 text-sm font-semibold text-muted italic"
                      >
                        &ldquo;{word.example}&rdquo;
                      </p>
                    </div>

                    {SIDES[i] && (
                      <span
                        ref={(el) => {
                          stampRefs.current[i] = el;
                        }}
                        style={{ opacity: 0 }}
                        className={`absolute top-14 right-5 rotate-[-12deg] border-[3px] border-line px-3 py-1 text-lg font-black uppercase shadow-brutal-sm ${
                          SIDES[i] === -1
                            ? "bg-box-5 text-on-box-5"
                            : "bg-box-1 text-on-box"
                        }`}
                      >
                        {SIDES[i] === -1 ? t.know : t.learn}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p
              aria-hidden="true"
              className="mt-12 flex w-full max-w-[460px] flex-wrap justify-between gap-x-4 gap-y-1 text-sm font-black uppercase"
            >
              <span className="text-muted">
                <FallText
                  text={t.hint}
                  place="hint"
                  falling={t.falling}
                  phones
                />
              </span>
              <span>
                <FallText
                  text={fill(t.known, { n: known })}
                  place="counter"
                  falling={t.falling}
                  phones
                />{" "}
                ·{" "}
                <FallText
                  text={fill(t.toLearn, { n: sorted.length - known })}
                  place="counter"
                  falling={t.falling}
                  phones
                />
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
