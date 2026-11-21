import { FallText } from "@/components/landing/fall-text";
import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import { WordBadge } from "@/components/landing/word-badge";
import type { LandingDictionary } from "@/features/i18n/landing";

type Falling = LandingDictionary["triage"]["falling"];

// The same numbered points as the other sections. With `falling`, some of
// their words fall into the boxes below (FallText).
function Points({
  points,
  falling = [],
}: {
  points: { title: string; text: string }[];
  falling?: Falling;
}) {
  return (
    <ul className="mt-8 grid gap-4">
      {points.map(({ title, text }, i) => (
        <li key={title} className="flex gap-4">
          <span
            aria-hidden="true"
            className="font-display flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-line bg-raised text-sm font-black shadow-brutal-sm"
          >
            {i + 1}
          </span>
          <p className="pt-1">
            <strong className="block font-black uppercase">
              <FallText
                text={title}
                place={`points.${i}.title`}
                falling={falling}
              />
            </strong>
            <span className="font-semibold text-muted">
              <FallText
                text={text}
                place={`points.${i}.text`}
                falling={falling}
              />
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

const TITLE =
  "text-[clamp(2rem,6vw,4rem)] leading-[0.98] font-black tracking-tight uppercase";

// New words: the step before reviews, dealt from a deck of word cards as
// the visitor scrolls (the section pins while it plays). As it moves on,
// some of its words fall into the boxes of "How it works" below.
export function TriageSection({ dict }: { dict: LandingDictionary }) {
  const { triage: t } = dict;

  return (
    <section
      id="new-words"
      aria-labelledby="new-words-title"
      className="flex scroll-mt-(--navbar-height) flex-col bg-canvas px-4 pt-16 pb-16 sm:px-8 sm:pt-20 lg:px-10 lg:pt-10 lg:pb-8"
    >
      <WordBadge
        t={t}
        translationLanguages={dict.translationLanguages}
        // Phones: the text sits above the deck and is long gone by the time
        // the boxes come, so none of its words fall.
        intro={
          <div>
            <h2 id="new-words-title" className={TITLE}>
              {t.titleLine1} <span className="block">{t.titleLine2}</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed font-semibold text-pretty text-muted sm:text-lg">
              {t.lead}
            </p>
            <Points points={t.points} />
          </div>
        }
        // From lg: held beside the deck, so its words can fall when it moves on.
        wideIntro={
          <div>
            <h2 className={TITLE}>
              <FallText text={t.titleLine1} place="title" falling={t.falling} />{" "}
              <span className="block">
                <FallText
                  text={t.titleLine2}
                  place="title"
                  falling={t.falling}
                />
              </span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed font-semibold text-pretty text-muted">
              <FallText text={t.lead} place="lead" falling={t.falling} />
            </p>
            <Points points={t.points} falling={t.falling} />
          </div>
        }
      />

      <SectionScrollLink
        href="#how-it-works"
        label={
          <FallText
            text={dict.scroll.toMethod}
            place="method"
            falling={t.falling}
            phones
          />
        }
        className="mt-6"
      />
    </section>
  );
}
