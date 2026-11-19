import { ReviewDemo } from "@/components/landing/review-demo";
import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import type { LandingDictionary } from "@/features/i18n/landing";
import { localePath, type Locale } from "@/features/i18n/locales";

type ReviewDemoSectionProps = {
  isAuthenticated: boolean;
  locale: Locale;
  dict: LandingDictionary;
};

export function ReviewDemoSection({ isAuthenticated, locale, dict }: ReviewDemoSectionProps) {
  const { review } = dict;

  return (
    <section
      id="daily-review"
      aria-labelledby="daily-review-title"
      className="
        flex scroll-mt-(--navbar-height)
        flex-col justify-center lg:min-h-[calc(100dvh-var(--navbar-height))] border-y-[3px] border-line bg-surface
        px-4 py-16 sm:px-8 sm:py-20 lg:px-10
      "
    >
      <div className="mx-auto grid w-full max-w-[1360px] items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2
            id="daily-review-title"
            className="text-[clamp(2rem,6vw,4rem)] leading-[0.98] font-black tracking-tight uppercase"
          >
            {review.titleLine1} <span className="block">{review.titleLine2}</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed font-semibold text-pretty text-muted sm:text-lg">
            {review.lead}
          </p>

          <ul className="mt-8 grid gap-4">
            {review.points.map(({ title, text }, i) => (
              <li key={title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="font-display flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-line bg-raised text-sm font-black shadow-brutal-sm"
                >
                  {i + 1}
                </span>
                <p className="pt-1">
                  <strong className="block font-black uppercase">{title}</strong>
                  <span className="font-semibold text-muted">{text}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="scroll-tilt min-w-0">
          <ReviewDemo
            isAuthenticated={isAuthenticated}
            signUpHref={localePath(locale, "register")}
            dict={review}
            boxLabel={dict.card.box}
            question={dict.card.question}
            translationLanguages={dict.translationLanguages}
          />
        </div>
      </div>

      <SectionScrollLink href="#sentence-practice" label={dict.scroll.toSentences} className="mt-14" />
    </section>
  );
}
