import { LEITNER_BOXES } from "@/features/leitner/boxes";
import {
  LEITNER_HOP_STEP_SECONDS,
  leitnerBoxStyles,
} from "@/components/landing/leitner-box-styles";

// Compact Leitner shelf under the hero deck: a word hops from box to box
// and each box lifts while it holds it. Decorative; the How it works
// section carries the accessible explanation.
export function HeroShelf() {
  return (
    <div aria-hidden="true" className="flex items-end gap-2 pt-9 sm:gap-3">
      {LEITNER_BOXES.map(({ box }, index) => {
        const delay = { animationDelay: `${index * LEITNER_HOP_STEP_SECONDS}s` };

        return (
          <div key={box} className="relative">
            <span
              className={`leitner-hop ${box === 3 ? "leitner-hop--rest" : ""} absolute bottom-full left-1/2 mb-2 -ml-9 flex h-7 w-18 items-center justify-center border-2 border-line bg-raised text-xs font-black text-fg shadow-brutal-sm sm:h-8 sm:text-sm`}
              style={delay}
              lang="en"
            >
              HELLO
            </span>

            <div
              className={`box-active font-display flex h-12 w-12 items-center justify-center border-[3px] border-line text-xl font-black shadow-brutal sm:h-14 sm:w-14 sm:text-2xl ${leitnerBoxStyles[box]}`}
              style={delay}
            >
              {box}
            </div>
          </div>
        );
      })}
    </div>
  );
}
