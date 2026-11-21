import type { CSSProperties } from "react";
import { Check, Swords, Timer, Users, Zap } from "lucide-react";

import { SceneText, sceneStyle } from "@/components/landing/scene";
import { ScrollScene } from "@/components/landing/scroll-scene";
import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import { WordTranslation } from "@/components/landing/word-translation";
import { fill } from "@/features/i18n/locales";
import type { LandingDictionary } from "@/features/i18n/landing";
import { DUEL_WORD } from "@/features/i18n/landing/words";

const POINT_ICONS = [Swords, Zap, Users];
const OPTIONS = ["journal", "journey", "jury", "joy"];
const FRIEND = "nana";

// Duels, shown as one round of a live match played by scrolling: the card
// comes in, the options deal out, the timer runs down, then "journey" gets
// picked and the points land. Same layout as the real round
// (src/components/duels/duel-match.tsx).
export function DuelSection({ dict }: { dict: LandingDictionary }) {
  const { duel: t } = dict;

  return (
    <section
      id="duels"
      aria-labelledby="duels-title"
      className="scroll-mt-(--navbar-height) bg-surface px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-0"
    >
      <ScrollScene
        length={1.2}
        className="flex flex-col justify-center lg:py-8"
      >
        <div className="mx-auto grid w-full max-w-[1360px] items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2
              id="duels-title"
              className="scene-rise text-[clamp(2rem,6vw,4rem)] leading-[0.98] font-black tracking-tight uppercase"
              style={sceneStyle(0.04, 0.22)}
            >
              {t.titleLine1} <span className="block">{t.titleLine2}</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed font-semibold text-pretty text-muted sm:text-lg">
              <SceneText text={t.lead} from={0.1} to={0.4} />
            </p>

            <ul className="mt-8 grid gap-4">
              {t.points.map(({ title, text }, i) => {
                const Icon = POINT_ICONS[i] ?? Swords;
                return (
                  <li
                    key={title}
                    className="scene-rise flex gap-4"
                    style={sceneStyle(0.2 + i * 0.06, 0.34 + i * 0.06)}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-line bg-raised shadow-brutal-sm"
                    >
                      <Icon className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <p className="pt-1">
                      <strong className="block font-black uppercase">
                        {title}
                      </strong>
                      <span className="font-semibold text-muted">{text}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* The example round; plain text, so screen readers read it in order. */}
          <div className="scene-rise min-w-0" style={sceneStyle(0.12, 0.36)}>
            <div className="border-[3px] border-line bg-raised text-fg shadow-brutal-lg">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b-[3px] border-line px-5 py-4 sm:px-7">
                <div className="relative min-w-0">
                  <p className="truncate text-sm font-black">@{t.you}</p>
                  <p className="font-display text-3xl font-black tabular-nums">
                    34
                  </p>
                  {/* The points for this round land after the pick. */}
                  <span
                    aria-hidden="true"
                    className="scene-pop absolute top-0 right-0 border-2 border-line bg-box-3 px-1.5 py-0.5 text-sm font-black text-on-box-3 shadow-brutal-sm"
                    style={sceneStyle(0.84, 0.9)}
                  >
                    +10
                  </span>
                </div>
                <p className="text-xs font-black tracking-wider text-muted uppercase">
                  {fill(t.round, { n: 7, total: 10 })}
                </p>
                <div className="min-w-0 text-right">
                  <p className="truncate text-sm font-black">@{FRIEND}</p>
                  <p className="font-display text-3xl font-black tabular-nums">
                    22
                  </p>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-7 sm:py-6">
                <p className="flex items-center gap-2 text-xs font-black tracking-wider text-muted uppercase">
                  <Timer
                    className="h-4 w-4"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                  {t.timeLeft}
                </p>
                <div
                  aria-hidden="true"
                  className="mt-2 h-4 overflow-hidden border-[3px] border-line bg-surface"
                >
                  {/* Runs down to 57% while the scene pins, then stops at the pick. */}
                  <div
                    className="scene-drain h-full w-full bg-primary"
                    style={sceneStyle(0.42, 0.8, {
                      "--drain": 0.43,
                    } as CSSProperties)}
                  />
                </div>

                <p className="mt-5 text-sm font-black text-muted uppercase">
                  {t.pick}
                </p>
                <WordTranslation
                  word={DUEL_WORD}
                  languages={dict.translationLanguages}
                  // 2xl on phones: "путешествие" in a 3xl wide display face breaks mid-word at 320px.
                  className="mt-1 font-display text-2xl font-black break-words min-[400px]:text-3xl sm:text-4xl"
                />

                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {OPTIONS.map((option, i) => {
                    const picked = option === DUEL_WORD.word;
                    const face = (
                      <>
                        <span
                          aria-hidden="true"
                          className="w-6 shrink-0 border-[2px] border-line text-center text-sm"
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 break-words">
                          {option}
                        </span>
                      </>
                    );
                    return (
                      <li
                        key={option}
                        lang="en"
                        className="scene-pop relative flex min-h-14 items-center gap-3 border-[3px] border-line bg-raised px-4 py-3 text-lg font-black shadow-brutal-sm"
                        style={sceneStyle(0.3 + i * 0.04, 0.4 + i * 0.04)}
                      >
                        {face}
                        {picked && (
                          // The pick: a green copy of the option stamps down over it.
                          <span
                            aria-hidden="true"
                            className="scene-pop absolute -inset-[3px] flex items-center gap-3 border-[3px] border-line bg-box-3 px-4 py-3 text-on-box-3"
                            style={sceneStyle(0.8, 0.85)}
                          >
                            {face}
                            <Check
                              className="h-5 w-5 shrink-0"
                              strokeWidth={3}
                            />
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <p
                  className="scene-fade mt-5 font-semibold text-muted"
                  style={sceneStyle(0.88, 0.95)}
                >
                  {fill(t.theyAnswered, { name: FRIEND })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <SectionScrollLink
          href="#sentence-practice"
          label={dict.scroll.toSentences}
          className="mt-14 lg:mt-10"
        />
      </ScrollScene>
    </section>
  );
}
