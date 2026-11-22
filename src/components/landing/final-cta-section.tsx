import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { SceneText, sceneStyle } from "@/components/landing/scene";
import { ScrollScene } from "@/components/landing/scroll-scene";
import type { LandingDictionary } from "@/features/i18n/landing";
import { fill, localePath, type Locale } from "@/features/i18n/locales";

type FinalCtaSectionProps = {
  isAuthenticated: boolean;
  locale: Locale;
  dict: LandingDictionary;
};

// The ending: the call to action beside a receipt that prints out as the
// section scrolls in, adding up what the page showed (total: free), then gets
// stamped. Like the sections before it, it holds at the top (from lg),
// and the receipt prints only once it is held.
export function FinalCtaSection({ isAuthenticated, locale, dict }: FinalCtaSectionProps) {
  const { cta } = dict;
  const { receipt } = cta;

  return (
    <section
      id="join-us"
      aria-labelledby="join-us-title"
      className="relative scroll-mt-(--navbar-height) overflow-clip border-t-[3px] border-line bg-cta text-on-cta"
    >
      <ScrollScene length={1.3} className="flex flex-col justify-center px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-8">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
            <h2
              id="join-us-title"
              className="flex flex-col items-center gap-3 text-[clamp(1.75rem,5vw,4rem)] leading-[0.98] font-black tracking-tight uppercase lg:items-start"
            >
              <span className="scene-rise" style={sceneStyle(0.05, 0.25)}>
                {cta.titleLine1}
              </span>{" "}
              {/* Slammed on like a stamp once the first line is in. */}
              <span className="scene-slam" style={sceneStyle(0.25, 0.35)}>
                <span className="brutal-lift text-[0.85em] text-fg sm:text-[1em]">{cta.titleStick}</span>
              </span>
            </h2>

            <p className="max-w-xl text-base leading-relaxed font-semibold text-pretty sm:text-xl">
              <SceneText text={cta.lead} from={0.15} to={0.45} />
            </p>

            <Link
              href={isAuthenticated ? "/dashboard" : localePath(locale, "register")}
              className={buttonClasses({ variant: "primary", size: "lg", className: "group" })}
            >
              {isAuthenticated ? cta.dashboard : dict.hero.ctaStart}
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5"
              >
                ↗
              </span>
            </Link>

            {!isAuthenticated && (
              <p className="-mt-3 max-w-sm text-sm font-semibold text-pretty">
                {cta.reassure}
              </p>
            )}

            {!isAuthenticated && (
              <p className="text-sm font-semibold">
                {cta.already}{" "}
                <Link
                  href={localePath(locale, "login")}
                  className="inline-flex min-h-11 items-center font-black underline decoration-[3px] underline-offset-4 hover:decoration-mark"
                >
                  {cta.logIn}
                </Link>
              </p>
            )}
          </div>

          {/* The receipt printer. The paper comes up out of the slot, top line
              first, and gets its stamp once it is all out. */}
          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden px-3 pt-4">
              <div className="scene-print relative" style={sceneStyle(0.45, 0.85)}>
                <div aria-hidden="true" className="receipt-edge h-2.5" />
                <div className="border-x-[3px] border-line bg-raised px-5 pt-3 pb-6 font-mono text-sm text-fg">
                  <p className="text-center font-display text-xl font-black tracking-tight">ELEVO✳</p>
                  <p className="mt-1 flex justify-between text-xs text-muted uppercase">
                    <span>#0001</span>
                    <span>{fill(dict.review.day, { n: 1 })}</span>
                  </p>

                  <ul className="mt-3 grid gap-1.5 border-y-2 border-dashed border-line py-3">
                    {receipt.rows.map(({ label, value }) => (
                      <li key={label} className="flex items-baseline gap-2">
                        <span>{label}</span>
                        <span aria-hidden="true" className="min-w-4 flex-1 border-b-2 border-dotted border-line/40" />
                        <span className="font-bold">{value}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-3 flex items-baseline justify-between text-lg font-black uppercase">
                    <span>{receipt.total}</span>
                    <span className="tabular-nums">{receipt.sum}</span>
                  </p>

                  <div aria-hidden="true" className="receipt-barcode mt-4 h-10" />
                  <p className="mt-3 text-center text-xs">{receipt.thanks}</p>

                  {/* Stamped once it is all printed, on the barcode: the sum and the
                      thank-you line stay readable. */}
                  <p
                    className="scene-slam absolute bottom-14 left-3 rotate-[-8deg] border-[3px] border-line bg-box-3 px-2 py-1 font-display text-sm font-black whitespace-nowrap sm:px-3 sm:py-1.5 sm:text-base text-on-box-3 uppercase shadow-brutal-sm"
                    style={sceneStyle(0.88, 0.96)}
                  >
                    {receipt.stamp}
                  </p>
                </div>
              </div>
            </div>
            {/* The printer, with its paper slot */}
            <div aria-hidden="true" className="relative h-14 border-[3px] border-line bg-line shadow-brutal">
              <span className="absolute inset-x-6 top-2 h-2 bg-canvas/30" />
              <span className="absolute right-4 bottom-3 h-2.5 w-2.5 bg-box-3" />
            </div>
          </div>
        </div>

      </ScrollScene>
    </section>
  );
}
