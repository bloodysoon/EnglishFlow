import { ReviewMonth } from "@/components/landing/review-month";
import { SceneText, sceneStyle } from "@/components/landing/scene";
import { ScrollScene } from "@/components/landing/scroll-scene";
import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import type { LandingDictionary } from "@/features/i18n/landing";

// "A review takes minutes": a sample month of reviews (ReviewMonth).
export function ReviewDemoSection({ dict }: { dict: LandingDictionary }) {
  const { review } = dict;

  return (
    <section
      id="daily-review"
      aria-labelledby="daily-review-title"
      className="
        scroll-mt-(--navbar-height) border-y-[3px] border-line bg-surface
        px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-0
      "
    >
      {/* The sample days play while the section is pinned: long enough to
          follow each review, short enough not to hold the page up. */}
      <ScrollScene
        length={1.6}
        className="flex flex-col justify-center lg:py-8"
      >
        <div className="mx-auto grid w-full max-w-[1360px] items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2
              id="daily-review-title"
              className="scene-rise text-[clamp(2rem,6vw,4rem)] leading-[0.98] font-black tracking-tight uppercase"
              style={sceneStyle(0.02, 0.12)}
            >
              {review.titleLine1}{" "}
              <span className="block">{review.titleLine2}</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed font-semibold text-pretty text-muted sm:text-lg">
              <SceneText text={review.lead} from={0.05} to={0.2} />
            </p>

            <ul className="mt-8 grid gap-4">
              {review.points.map(({ title, text }, i) => (
                <li
                  key={title}
                  className="scene-rise flex gap-4"
                  style={sceneStyle(0.1 + i * 0.04, 0.2 + i * 0.04)}
                >
                  <span
                    aria-hidden="true"
                    className="font-display flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-line bg-raised text-sm font-black shadow-brutal-sm"
                  >
                    {i + 1}
                  </span>
                  <p className="pt-1">
                    <strong className="block font-black uppercase">
                      {title}
                    </strong>
                    <span className="font-semibold text-muted">{text}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="scene-rise min-w-0" style={sceneStyle(0.04, 0.18)}>
            <ReviewMonth
              t={review}
              boxLabel={dict.card.box}
              boxWord={dict.how.box}
            />
          </div>
        </div>

        <SectionScrollLink
          href="#duels"
          label={dict.scroll.toDuels}
          className="mt-14 lg:mt-10"
        />
      </ScrollScene>
    </section>
  );
}
