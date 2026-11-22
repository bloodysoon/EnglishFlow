import {
  CheckCircle2,
  Clock,
  PenLine,
  SpellCheck,
  XCircle,
} from "lucide-react";

import { SceneText, sceneStyle } from "@/components/landing/scene";
import { ScrollScene } from "@/components/landing/scroll-scene";
import type { LandingDictionary } from "@/features/i18n/landing";

const POINT_ICONS = [PenLine, SpellCheck, Clock];

// Splits a typing window [from, to] across text pieces by their length, so
// a sentence made of several pieces types at one even pace.
function typingWindows(
  pieces: string[],
  from: number,
  to: number,
): [number, number][] {
  const total = pieces.reduce((sum, piece) => sum + piece.length, 0) || 1;
  let at = from;
  return pieces.map((piece) => {
    const end = at + ((to - from) * piece.length) / total;
    const window: [number, number] = [at, end];
    at = end;
    return window;
  });
}

// Sentence practice, shown as a worked example: a first try with one mistake
// marked, then the fixed sentence with its tense. Mirrors the practice box on
// a word's page (src/components/learn/sentence-check.tsx). Played by
// scrolling: the first try types itself, the mistake gets marked, then the
// fixed sentence types in and the checks land.
export function SentenceSection({ dict }: { dict: LandingDictionary }) {
  const { sentence: t } = dict;
  const [fixedBefore = "", fixedAfter = ""] = t.fixed.split(t.fixedWord);
  const [tBefore, tMistake, tAfter] = typingWindows(
    [t.before, t.mistake, t.after],
    0.4,
    0.55,
  );
  // The fixed sentence: up to the word, then a beat for its highlight to
  // pop on, then the rest.
  const [tFixedBefore, tFixedWord] = typingWindows(
    [fixedBefore, t.fixedWord],
    0.7,
    0.78,
  );
  const tFixedAfter: [number, number] = [0.83, 0.87];

  return (
    <section
      id="sentence-practice"
      aria-labelledby="sentence-practice-title"
      className="scroll-mt-(--navbar-height) bg-canvas px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-0"
    >
      <ScrollScene
        length={1.3}
        className="flex flex-col justify-center lg:py-8"
      >
        <div className="mx-auto grid w-full max-w-[1360px] items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2">
            <h2
              id="sentence-practice-title"
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
                const Icon = POINT_ICONS[i] ?? PenLine;
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

          {/* The example card; plain text, so screen readers read it in order. */}
          <div
            className="scene-rise min-w-0 lg:order-1"
            style={sceneStyle(0.12, 0.36)}
          >
            <div className="border-[3px] border-line bg-raised text-fg shadow-brutal-lg">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[3px] border-line px-5 py-4 sm:px-7">
                <p
                  lang="en"
                  className="font-display text-[clamp(2rem,7vw,3rem)] leading-none font-black tracking-tight"
                >
                  borrow
                </p>
                <p className="text-sm font-bold text-muted">{t.prompt}</p>
              </div>

              <div className="grid gap-3 border-b-[3px] border-dashed border-line px-5 py-5 sm:px-7">
                <p className="text-xs font-black tracking-wider text-muted uppercase">
                  {t.firstTry}
                </p>
                <p
                  lang="en"
                  className="text-lg leading-snug font-bold sm:text-xl"
                >
                  <SceneText
                    text={t.before}
                    from={tBefore[0]}
                    to={tBefore[1]}
                    by="letter"
                  />
                  <mark
                    className="scene-underline bg-transparent text-fg underline decoration-mark decoration-wavy decoration-[3px] underline-offset-4"
                    style={sceneStyle(0.56, 0.6)}
                  >
                    <SceneText
                      text={t.mistake}
                      from={tMistake[0]}
                      to={tMistake[1]}
                      by="letter"
                    />
                  </mark>
                  <SceneText
                    text={t.after}
                    from={tAfter[0]}
                    to={tAfter[1]}
                    by="letter"
                  />
                </p>
                <p
                  className="scene-rise flex items-start gap-2 text-sm font-semibold"
                  style={sceneStyle(0.58, 0.64)}
                >
                  <XCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-mark"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                  {t.hint}
                </p>
              </div>

              <div
                className="scene-fade grid gap-3 px-5 py-5 sm:px-7"
                style={sceneStyle(0.64, 0.69)}
              >
                <p className="text-xs font-black tracking-wider text-muted uppercase">
                  {t.secondTry}
                </p>
                <p
                  lang="en"
                  className="text-lg leading-snug font-bold sm:text-xl"
                >
                  <SceneText
                    text={fixedBefore}
                    from={tFixedBefore[0]}
                    to={tFixedBefore[1]}
                    by="letter"
                  />
                  {/* The word types in plain first; then its highlight box
                      pops on over it (a copy, in the box's colours). */}
                  <span className="relative inline-block border-2 border-transparent px-1">
                    <SceneText
                      text={t.fixedWord}
                      from={tFixedWord[0]}
                      to={tFixedWord[1]}
                      by="letter"
                    />
                    <span
                      aria-hidden="true"
                      className="scene-pop absolute -inset-[2px] border-2 border-line bg-box-3 px-1 text-on-box-3"
                      style={sceneStyle(
                        tFixedWord[1] + 0.005,
                        tFixedWord[1] + 0.04,
                      )}
                    >
                      {t.fixedWord}
                    </span>
                  </span>
                  <SceneText
                    text={fixedAfter}
                    from={tFixedAfter[0]}
                    to={tFixedAfter[1]}
                    by="letter"
                  />
                </p>
                <ul className="flex flex-wrap gap-2 text-xs font-black uppercase">
                  <li
                    className="scene-pop flex items-center gap-1.5 border-2 border-line bg-box-3 px-2.5 py-1 text-on-box-3"
                    style={sceneStyle(0.88, 0.92)}
                  >
                    <CheckCircle2
                      className="h-4 w-4"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                    {t.noMistakes}
                  </li>
                  <li
                    lang="en"
                    className="scene-pop flex items-center gap-1.5 border-2 border-line bg-box-4 px-2.5 py-1 text-on-box"
                    style={sceneStyle(0.92, 0.96)}
                  >
                    <Clock
                      className="h-4 w-4"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                    {t.tense}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </ScrollScene>
    </section>
  );
}
