import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { MARQUEE_WORDS as WORDS } from "@/features/i18n/landing/words";

// Decorative ticker closing the first screen. Pauses on hover and stands
// still under reduced motion (globals.css, .marquee-track).
export function WordMarquee() {
  const items = [...WORDS, ...WORDS];

  return (
    <div
      aria-hidden="true"
      className="marquee overflow-hidden border-y-[3px] border-line bg-surface py-4"
    >
      <ul
        lang="en"
        className="marquee-track flex w-max items-center gap-4 pr-4"
      >
        {items.map(({ word, box }, index) => (
          <li
            key={`${word}-${index}`}
            className="flex shrink-0 items-center gap-3 border-[3px] border-line bg-raised py-1.5 pr-4 pl-1.5 text-fg shadow-brutal-sm"
          >
            <span
              className={`font-display flex h-7 w-7 items-center justify-center border-2 border-line text-sm font-black ${leitnerBoxStyles[box]}`}
            >
              {box}
            </span>
            <span className="font-display text-base font-black uppercase sm:text-lg">
              {word}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
