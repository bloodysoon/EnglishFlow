import { ArrowUp, RotateCcw } from "lucide-react";

import { LeitnerCrate } from "@/components/landing/leitner-crate";
import { SceneText, sceneStyle } from "@/components/landing/scene";
import { ScrollScene } from "@/components/landing/scroll-scene";
import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { LEITNER_BOXES } from "@/features/leitner/boxes";
import { fill, type Locale } from "@/features/i18n/locales";
import type { LandingDictionary } from "@/features/i18n/landing";
import { MARQUEE_WORDS } from "@/features/i18n/landing/words";
import { formatReviewIntervalFor } from "@/features/i18n/review-interval";

type HowItWorksSectionProps = {
  locale: Locale;
  dict: LandingDictionary;
};

// Where the card slots stand in a box; filled back row first.
const SLOT_PLACES = [
  // Back row: taller cards, so their words show above the front row.
  "left-[4%] -rotate-6 pb-12",
  "right-[4%] rotate-6 pb-12",
  // Front row.
  "left-[18%] rotate-2 pb-5",
  "right-[18%] -rotate-3 pb-5",
];

export function HowItWorksSection({ locale, dict }: HowItWorksSectionProps) {
  const { how } = dict;

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="
        scroll-mt-(--navbar-height) border-t-[3px] border-line bg-canvas px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-0
      "
    >
      {/* Played by scrolling: the heading, then the boxes one by one, then the two rules. */}
      <ScrollScene
        length={0.8}
        className="flex flex-col justify-center lg:py-8"
      >
        {/* my-auto centres the content and leaves the arrow at the bottom of the screen. */}
        <div className="mx-auto w-full max-w-[1360px]">
          <div className="mb-16 grid gap-5 sm:mb-24 lg:grid-cols-2 lg:items-end lg:gap-10">
            <div>
              <h2
                id="how-it-works-title"
                className="scene-rise text-[clamp(2rem,6vw,4rem)] leading-[0.98] font-black tracking-tight uppercase"
                style={sceneStyle(0.02, 0.16)}
              >
                {how.titleLine1} <span className="block">{how.titleLine2}</span>
              </h2>
            </div>

            <p className="max-w-xl text-base leading-relaxed font-semibold text-pretty text-muted sm:text-lg lg:justify-self-end">
              <SceneText text={how.lead} from={0.1} to={0.38} />
            </p>
          </div>

          {/* The shelf: column on phones, row from md up. The crates rise,
              open, and the words falling from the first screen land in them as
              cards (FallingWords); the track under them fills meanwhile. */}
          <ol className="grid gap-4 md:grid-cols-5">
            {LEITNER_BOXES.map(({ box, intervalDays }, index) => {
              const words = MARQUEE_WORDS.filter((w) => w.box === box);

              return (
                <li
                  key={box}
                  data-fall-box={box}
                  className="scene-rise flex min-w-0 flex-col"
                  style={sceneStyle(0.04 + index * 0.03, 0.18 + index * 0.03)}
                >
                  <LeitnerCrate
                    box={box}
                    className="md:flex-col"
                    open
                    inside={SLOT_PLACES.map((place, i) => (
                      // Card slots, tops showing above the box. Static: the
                      // box's own words in the first two. FallingWords fills
                      // them with whatever falls in.
                      <span
                        key={place}
                        data-fall-slot
                        aria-hidden="true"
                        className={`absolute bottom-[calc(100%-0.25rem)] border-2 border-line bg-raised px-2 pt-1 text-xs font-black whitespace-nowrap text-fg uppercase shadow-brutal-sm ${place} ${
                          words[i] ? "" : "invisible"
                        }`}
                      >
                        <span
                          className={`mb-1 block h-1.5 border border-line ${leitnerBoxStyles[box]}`}
                        />
                        <span data-fall-text>{words[i]?.word}</span>
                      </span>
                    ))}
                  >
                    {/* How many words this box caught (FallingWords). */}
                    <span
                      data-fall-count
                      aria-hidden="true"
                      className="invisible absolute top-2.5 right-2.5 z-10 flex h-8 min-w-8 items-center justify-center border-[3px] border-line bg-fg px-1 text-sm font-black text-canvas shadow-brutal-sm"
                    />

                    {/* Label plate, as on a card file box. */}
                    <p className="flex min-w-18 shrink-0 flex-col items-center justify-center border-r-[3px] border-line px-2 py-3 md:flex-row md:justify-start md:border-r-0 md:border-b-[3px] md:px-4">
                      <span className="flex items-baseline gap-1.5 border-2 border-line bg-raised px-2 py-0.5 text-fg shadow-brutal-sm">
                        <span className="text-[0.625rem] font-black tracking-wider uppercase">
                          {how.box}
                        </span>
                        <span className="font-display text-2xl leading-none font-black">
                          {box}
                        </span>
                      </span>
                      <span className="sr-only">
                        {" "}
                        {fill(how.boxOf, { total: LEITNER_BOXES.length })}
                      </span>
                    </p>

                    <div className="min-w-0 flex-1 px-4 py-3 md:pt-4 md:pb-8">
                      <p className="font-black uppercase">
                        {how.boxLabels[box]}
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {fill(how.review, {
                          interval: formatReviewIntervalFor(
                            locale,
                            intervalDays,
                          ),
                        })}
                      </p>
                    </div>

                    {/* Finger pull. */}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-2.5 left-1/2 hidden h-2.5 w-12 -translate-x-1/2 rounded-full border-2 border-line bg-line/35 md:block"
                    />
                  </LeitnerCrate>
                </li>
              );
            })}
          </ol>

          {/* Progress from new to mastered, filling as the words land. */}
          <div
            aria-hidden="true"
            className="scene-fade mt-6 hidden items-center gap-4 md:flex"
            style={sceneStyle(0.12, 0.2)}
          >
            <span className="text-xs font-black tracking-widest uppercase">
              {how.progressNew}
            </span>
            <div className="h-4 flex-1 overflow-hidden border-[3px] border-line bg-raised">
              <div
                className="scene-grow h-full w-full bg-[linear-gradient(90deg,var(--box-1),var(--box-2),var(--box-3),var(--box-4),var(--box-5))]"
                style={sceneStyle(0.2, 0.6)}
              />
            </div>
            <span className="text-xs font-black tracking-widest uppercase">
              {how.progressMastered}
            </span>
          </div>

          {/* The one rule that drives the whole method. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <p
              style={sceneStyle(0.58, 0.7)}
              className="scene-left lift-safe group flex items-center gap-4 border-[3px] border-line bg-raised px-5 py-4 font-semibold shadow-brutal-md transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-brutal motion-reduce:transition-none"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-line bg-box-3 text-on-box-3">
                <ArrowUp
                  className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </span>
              <span>
                <strong className="font-black uppercase">
                  {how.rememberedTitle}
                </strong>{" "}
                {how.rememberedText}
              </span>
            </p>

            <p
              style={sceneStyle(0.62, 0.74)}
              className="scene-right lift-safe group flex items-center gap-4 border-[3px] border-line bg-raised px-5 py-4 font-semibold shadow-brutal-md transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-brutal motion-reduce:transition-none"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-line bg-box-1 text-on-box">
                <RotateCcw
                  className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-180 motion-reduce:transition-none"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </span>
              <span>
                <strong className="font-black uppercase">
                  {how.forgotTitle}
                </strong>{" "}
                {how.forgotText}
              </span>
            </p>
          </div>
        </div>

        <SectionScrollLink
          href="#daily-review"
          label={dict.scroll.toReview}
          className="mt-12"
        />
      </ScrollScene>
    </section>
  );
}
