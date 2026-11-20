import { CheckCircle2, Clock, PenLine, SpellCheck, XCircle } from "lucide-react";

import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import type { LandingDictionary } from "@/features/i18n/landing";

const POINT_ICONS = [PenLine, SpellCheck, Clock];

// Sentence practice, shown as a worked example: a first try with one mistake
// marked, then the fixed sentence with its tense. Mirrors the practice box on
// a word's page (src/components/learn/sentence-check.tsx).
export function SentenceSection({ dict }: { dict: LandingDictionary }) {
  const { sentence: t } = dict;
  const [fixedBefore, fixedAfter] = t.fixed.split(t.fixedWord);

  return (
    <section
      id="sentence-practice"
      aria-labelledby="sentence-practice-title"
      className="flex scroll-mt-(--navbar-height) flex-col bg-canvas px-4 py-16 sm:px-8 sm:py-20 lg:min-h-[calc(100dvh-var(--navbar-height))] lg:px-10 lg:pb-8"
    >
      <div className="mx-auto grid w-full max-w-[1360px] items-center gap-14 lg:my-auto lg:grid-cols-2 lg:gap-16">
        <div className="lg:order-2">
          <h2
            id="sentence-practice-title"
            className="text-[clamp(2rem,6vw,4rem)] leading-[0.98] font-black tracking-tight uppercase"
          >
            {t.titleLine1} <span className="block">{t.titleLine2}</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed font-semibold text-pretty text-muted sm:text-lg">
            {t.lead}
          </p>

          <ul className="mt-8 grid gap-4">
            {t.points.map(({ title, text }, i) => {
              const Icon = POINT_ICONS[i] ?? PenLine;
              return (
                <li key={title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-line bg-raised shadow-brutal-sm"
                  >
                    <Icon className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <p className="pt-1">
                    <strong className="block font-black uppercase">{title}</strong>
                    <span className="font-semibold text-muted">{text}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* The example card; plain text, so screen readers read it in order. */}
        <div className="scroll-tilt min-w-0 lg:order-1">
          <div className="border-[3px] border-line bg-raised text-fg shadow-brutal-lg">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[3px] border-line px-5 py-4 sm:px-7">
              <p lang="en" className="font-display text-[clamp(2rem,7vw,3rem)] leading-none font-black tracking-tight">
                borrow
              </p>
              <p className="text-sm font-bold text-muted">{t.prompt}</p>
            </div>

            <div className="grid gap-3 border-b-[3px] border-dashed border-line px-5 py-5 sm:px-7">
              <p className="text-xs font-black tracking-wider text-muted uppercase">{t.firstTry}</p>
              <p lang="en" className="text-lg leading-snug font-bold sm:text-xl">
                {t.before}
                <mark className="bg-transparent text-fg underline decoration-mark decoration-wavy decoration-[3px] underline-offset-4">
                  {t.mistake}
                </mark>
                {t.after}
              </p>
              <p className="flex items-start gap-2 text-sm font-semibold">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-mark" strokeWidth={3} aria-hidden="true" />
                {t.hint}
              </p>
            </div>

            <div className="grid gap-3 px-5 py-5 sm:px-7">
              <p className="text-xs font-black tracking-wider text-muted uppercase">{t.secondTry}</p>
              <p lang="en" className="text-lg leading-snug font-bold sm:text-xl">
                {fixedBefore}
                <span className="border-2 border-line bg-box-3 px-1 text-on-box-3">{t.fixedWord}</span>
                {fixedAfter}
              </p>
              <ul className="flex flex-wrap gap-2 text-xs font-black uppercase">
                <li className="flex items-center gap-1.5 border-2 border-line bg-box-3 px-2.5 py-1 text-on-box-3">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  {t.noMistakes}
                </li>
                <li lang="en" className="flex items-center gap-1.5 border-2 border-line bg-box-4 px-2.5 py-1 text-on-box">
                  <Clock className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  {t.tense}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <SectionScrollLink href="#join-us" label={dict.scroll.toStart} className="mt-14" />
    </section>
  );
}
