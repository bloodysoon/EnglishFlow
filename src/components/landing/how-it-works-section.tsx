import { ArrowUp, RotateCcw } from "lucide-react";

import { LeitnerCrate } from "@/components/landing/leitner-crate";
import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import { WordTranslation } from "@/components/landing/word-translation";
import { LEITNER_HOP_STEP_SECONDS } from "@/components/landing/leitner-box-styles";
import { LEITNER_BOXES } from "@/features/leitner/boxes";
import { fill, type Locale } from "@/features/i18n/locales";
import type { LandingDictionary } from "@/features/i18n/landing";
import { HOP_WORD } from "@/features/i18n/landing/words";
import { formatReviewIntervalFor } from "@/features/i18n/review-interval";

type HowItWorksSectionProps = {
  locale: Locale;
  dict: LandingDictionary;
};

export function HowItWorksSection({ locale, dict }: HowItWorksSectionProps) {
  const { how } = dict;

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="
        flex scroll-mt-(--navbar-height)
        flex-col justify-center lg:min-h-[calc(100dvh-var(--navbar-height))] bg-canvas px-4 py-16 sm:px-8 sm:py-20 lg:px-10
      "
    >
      <div className="mx-auto w-full max-w-[1360px]">
        <div className="mb-12 grid gap-5 lg:grid-cols-2 lg:items-end lg:gap-10">
          <div>
            <h2
              id="how-it-works-title"
              className="text-[clamp(2rem,6vw,4rem)] leading-[0.98] font-black tracking-tight uppercase"
            >
              {how.titleLine1} <span className="block">{how.titleLine2}</span>
            </h2>
          </div>

          <p className="max-w-xl text-base leading-relaxed font-semibold text-pretty text-muted sm:text-lg lg:justify-self-end">
            {how.lead}
          </p>
        </div>

        {/* The shelf: column on phones, row from md up. */}
        <ol className="scroll-tilt grid gap-4 md:grid-cols-5">
          {LEITNER_BOXES.map(({ box, intervalDays }, index) => {
            const delay = { animationDelay: `${index * LEITNER_HOP_STEP_SECONDS}s` };

            return (
              <li key={box} className="flex min-w-0 flex-col">
                <LeitnerCrate
                  box={box}
                  className="md:flex-col"
                  style={delay}
                  hop
                  open={box === 3}
                  inside={
                    // One word with its translation drops box to box.
                    <span
                      className={`crate-drop ${box === 3 ? "leitner-hop--rest" : ""} absolute inset-x-0 bottom-[calc(100%-1.75rem)] mx-auto flex w-fit min-w-24 flex-col items-center border-2 border-line bg-raised px-2.5 py-1.5 text-center text-fg shadow-brutal-sm`}
                      style={delay}
                    >
                      <span lang="en" className="text-sm leading-tight font-black uppercase">
                        {HOP_WORD.word}
                      </span>
                      <WordTranslation
                        word={HOP_WORD}
                        languages={dict.translationLanguages}
                        className={`text-xs leading-tight font-bold text-muted ${dict.translationLanguages.length > 1 ? "items-center" : ""}`}
                      />
                    </span>
                  }
                >
                  <p className="flex min-w-18 shrink-0 flex-col items-center justify-center border-r-[3px] border-line px-2 py-3 md:flex-row md:items-baseline md:justify-start md:gap-2 md:border-r-0 md:border-b-[3px] md:px-4">
                    <span className="text-xs font-black tracking-wider uppercase">{how.box}</span>
                    <span className="font-display text-4xl leading-none font-black">{box}</span>
                    <span className="sr-only"> {fill(how.boxOf, { total: LEITNER_BOXES.length })}</span>
                  </p>

                  <div className="min-w-0 flex-1 px-4 py-3 md:py-5">
                    <p className="font-black uppercase">{how.boxLabels[box]}</p>
                    <p className="mt-1 text-sm font-bold">
                      {fill(how.review, { interval: formatReviewIntervalFor(locale, intervalDays) })}
                    </p>
                  </div>
                </LeitnerCrate>
              </li>
            );
          })}
        </ol>

        {/* Progress from new to mastered, in step with the hopping word. */}
        <div aria-hidden="true" className="mt-6 hidden items-center gap-4 md:flex">
          <span className="text-xs font-black tracking-widest uppercase">{how.progressNew}</span>
          <div className="h-4 flex-1 overflow-hidden border-[3px] border-line bg-raised">
            <div className="track-fill h-full w-full bg-[linear-gradient(90deg,var(--box-1),var(--box-2),var(--box-3),var(--box-4))]" />
          </div>
          <span className="text-xs font-black tracking-widest uppercase">{how.progressMastered}</span>
        </div>

        {/* The one rule that drives the whole method. */}
        <div className="scroll-tilt mt-10 grid gap-4 sm:grid-cols-2">
          <p className="lift-safe group flex items-center gap-4 border-[3px] border-line bg-raised px-5 py-4 font-semibold shadow-brutal-md transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-brutal motion-reduce:transition-none">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-line bg-box-3 text-on-box-3">
              <ArrowUp
                className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none"
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
            <span>
              <strong className="font-black uppercase">{how.rememberedTitle}</strong>{" "}
              {how.rememberedText}
            </span>
          </p>

          <p className="lift-safe group flex items-center gap-4 border-[3px] border-line bg-raised px-5 py-4 font-semibold shadow-brutal-md transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-brutal motion-reduce:transition-none">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-line bg-box-1 text-on-box">
              <RotateCcw
                className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-180 motion-reduce:transition-none"
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
            <span>
              <strong className="font-black uppercase">{how.forgotTitle}</strong>{" "}
              {how.forgotText}
            </span>
          </p>
        </div>

        <SectionScrollLink href="#daily-review" label={dict.scroll.toReview} className="mt-12" />
      </div>
    </section>
  );
}
