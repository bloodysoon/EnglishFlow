import { LEITNER_BOXES } from "@/features/leitner/boxes";
import {
  LEITNER_HOP_STEP_SECONDS,
  leitnerBoxStyles,
} from "@/components/landing/leitner-box-styles";

// Compact Leitner shelf for the hero: a word hops from box to box so the
// method is visible on the first screen at every width. Decorative; the
// How it works section carries the accessible explanation.
export function HeroShelf() {
  return (
    <div aria-hidden="true" className="flex items-end gap-1.5 pt-10 sm:gap-3 sm:pt-12">
      {LEITNER_BOXES.map(({ box }, index) => (
        <div key={box} className="relative">
          <span
            className={`leitner-hop ${box === 3 ? "leitner-hop--rest" : ""} absolute bottom-full left-1/2 mb-2 -ml-9 flex h-7 w-18 items-center justify-center border-[2px] border-brand-ink bg-white text-xs font-black text-brand-ink shadow-brutal-sm sm:h-8 sm:text-sm`}
            style={{ animationDelay: `${index * LEITNER_HOP_STEP_SECONDS}s` }}
          >
            HELLO
          </span>

          <div
            className={`font-display flex h-12 w-12 items-center justify-center border-[3px] border-brand-ink text-xl font-black shadow-brutal-sm sm:h-16 sm:w-16 sm:text-2xl ${leitnerBoxStyles[box]}`}
          >
            {box}
          </div>
        </div>
      ))}
    </div>
  );
}
