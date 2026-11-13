import { Check, RotateCcw } from "lucide-react";

import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import {
  LEITNER_BOXES,
  formatReviewInterval,
} from "@/features/leitner/boxes";

// Visual identity per box: loud and warm while a word is new, calm and
// dark once it is mastered.
const boxStyles: Record<number, string> = {
  1: "bg-brand-pink text-brand-ink",
  2: "bg-brand-orange text-brand-ink",
  3: "bg-brand-purple text-white",
  4: "bg-brand-green text-brand-ink",
  5: "bg-brand-ink text-brand-cream",
};

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="
        relative flex min-h-[calc(100dvh-83px)] scroll-mt-20
        flex-col justify-center
        overflow-hidden border-t-[3px] border-brand-ink
        bg-brand-cream px-4
        pt-12 pb-36
        sm:px-8 sm:pt-16 sm:pb-40
      "
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl">
            How it works
          </h2>

          <p className="mx-auto mt-3 max-w-xl font-bold sm:text-lg">
            The Leitner method: every word lives in one of five boxes. The
            better you know it, the less often you see it.
          </p>
        </div>

        {/* The shelf: column on phones, row from md up. */}
        <ol className="grid gap-3 md:grid-cols-5 md:gap-4">
          {LEITNER_BOXES.map(({ box, intervalDays, label }, index) => (
            <li
              key={box}
              className={`flex min-w-0 border-[3px] border-brand-ink shadow-brutal md:flex-col ${boxStyles[box]}`}
            >
              <p className="flex w-16 shrink-0 flex-col items-center justify-center border-r-[3px] border-brand-ink py-3 md:w-auto md:flex-row md:items-baseline md:justify-start md:gap-2 md:border-r-0 md:border-b-[3px] md:px-4">
                <span className="text-xs font-black uppercase tracking-widest md:text-sm">
                  Box
                </span>
                <span className="font-display text-4xl leading-none font-black">{box}</span>
                <span className="sr-only"> of {LEITNER_BOXES.length}</span>
              </p>

              <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 md:flex-col md:items-start md:py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-black uppercase">{label}</p>
                  <p className="mt-1 text-sm font-bold">
                    Review {formatReviewInterval(intervalDays)}
                  </p>
                </div>

                {/* One word hopping box to box; each slot shows it in turn. */}
                <div
                  aria-hidden="true"
                  className="relative h-10 w-20 shrink-0 md:mt-2 md:h-12 md:w-full"
                >
                  <span
                    className={`leitner-hop ${box === 3 ? "leitner-hop--rest" : ""} absolute inset-0 m-auto flex h-9 w-20 -rotate-3 items-center justify-center border-[2px] border-brand-ink bg-white text-sm font-black text-brand-ink shadow-brutal-sm`}
                    style={{ animationDelay: `${index * 1.6}s` }}
                  >
                    HELLO
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* The one rule that drives the whole method. */}
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <p className="flex items-center gap-3 border-[3px] border-brand-ink bg-brand-green px-4 py-3 font-bold shadow-brutal-md">
            <Check className="h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
            <span>
              <strong className="font-black uppercase">Remembered it?</strong>{" "}
              It moves up a box.
            </span>
          </p>

          <p className="flex items-center gap-3 border-[3px] border-brand-ink bg-white px-4 py-3 font-bold shadow-brutal-md">
            <RotateCcw className="h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
            <span>
              <strong className="font-black uppercase">Forgot it?</strong> Back
              to Box 1.
            </span>
          </p>
        </div>
      </div>

      <SectionScrollLink
        href="#join-us"
        label="Ready to start?"
        variant="purple"
      />
    </section>
  );
}
