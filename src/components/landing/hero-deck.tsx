import type { CSSProperties } from "react";
import { CalendarClock } from "lucide-react";

import { HeroShelf } from "@/components/landing/hero-shelf";
import { HeroTilt } from "@/components/landing/hero-tilt";
import { WordTranslation } from "@/components/landing/word-translation";
import { fill } from "@/features/i18n/locales";
import type { LandingDictionary } from "@/features/i18n/landing";
import { HERO_WORD } from "@/features/i18n/landing/words";

// The hero's picture of the product: a deck of word cards whose top card
// flips between the English word and its translation, sitting on the
// Leitner shelf. Decorative copy of what the page explains in text, so
// hidden from assistive tech. The deck is a CSS 3D scene: cards sit at
// different depths, chips float in front, and the stage leans to the mouse.
export function HeroDeck({ dict }: { dict: LandingDictionary }) {
  const { card } = dict;

  return (
    <div aria-hidden="true" className="mx-auto flex w-full max-w-[540px] flex-col items-center gap-10 [perspective:1400px]">
      <HeroTilt className="relative w-full px-3 pt-6 sm:px-6">
        {/* Cards waiting underneath */}
        <div className="absolute inset-x-6 top-10 -bottom-2 rotate-[-7deg] -translate-z-16 border-[3px] border-line bg-box-4 shadow-brutal sm:inset-x-10" />
        <div className="absolute inset-x-6 top-8 bottom-0 rotate-[5deg] -translate-z-8 border-[3px] border-line bg-box-2 shadow-brutal sm:inset-x-10" />

        {/* The card being reviewed */}
        <div className="relative transform-3d">
          <div className="flip-card relative h-[280px] sm:h-[330px]">
            <div className="flip-face absolute inset-0 flex flex-col justify-between border-[3px] border-line bg-raised p-5 text-fg shadow-brutal-lg sm:p-7">
              <div className="flex items-center justify-between gap-3 text-xs font-black tracking-widest uppercase">
                <span className="border-2 border-line bg-box-2 px-2 py-1 text-on-box">
                  {fill(card.box, { box: 2 })}
                </span>
                <span className="text-muted">{card.dueToday}</span>
              </div>

              <div lang="en">
                <p className="font-display text-[clamp(2.25rem,9vw,3.75rem)] leading-none font-black tracking-tight">
                  {HERO_WORD.word}
                </p>
                <p className="mt-3 text-base font-bold text-muted sm:text-lg">
                  {HERO_WORD.phonetic}
                </p>
              </div>

              <p className="border-t-[3px] border-dashed border-line pt-3 text-sm font-black uppercase">
                {card.question}
              </p>
            </div>

            <div className="flip-face flip-face--back absolute inset-0 flex flex-col justify-between border-[3px] border-line bg-box-3 p-5 text-on-box-3 shadow-brutal-lg sm:p-7">
              <p className="text-xs font-black tracking-widest uppercase">
                <span lang="en">{HERO_WORD.word}</span> · {card.translation}
              </p>

              <div>
                <WordTranslation
                  word={HERO_WORD}
                  languages={dict.translationLanguages}
                  className="font-display text-[clamp(1.75rem,7vw,2.75rem)] leading-tight font-black"
                />
                <p lang="en" className="mt-3 text-base font-semibold italic">
                  &ldquo;{HERO_WORD.example}&rdquo;
                </p>
              </div>

              <p className="flex items-center gap-2 border-t-[3px] border-dashed border-line pt-3 text-sm font-black uppercase">
                ✓ {card.gotIt} <span className="opacity-60">→</span> {fill(card.box, { box: 3 })}
              </p>
            </div>
          </div>
        </div>

        {/* Progress chips around the card */}
        <span
          className="bob absolute -top-1 right-0 z-10 translate-z-14 flex items-center gap-1.5 border-[3px] border-line bg-raised px-3 py-1.5 text-xs font-black text-fg uppercase shadow-brutal-sm sm:-right-2 sm:text-sm"
          style={{ "--tilt": "4deg" } as CSSProperties}
        >
          <CalendarClock className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" /> {card.nextReview}
        </span>

        <span
          className="bob absolute -bottom-4 left-0 z-10 translate-z-14 border-[3px] border-line bg-chip px-3 py-1.5 text-xs font-black text-on-box uppercase shadow-brutal-sm sm:-left-2 sm:text-sm"
          style={{ "--tilt": "-4deg", "--delay": "1.2s" } as CSSProperties}
        >
          {card.xp} ★
        </span>
      </HeroTilt>

      <HeroShelf />
    </div>
  );
}
