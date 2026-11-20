import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { HeroDeck } from "@/components/landing/hero-deck";
import { riseStyle as rise } from "@/components/ui/rise";
import type { LandingDictionary } from "@/features/i18n/landing";
import { localePath, type Locale } from "@/features/i18n/locales";

type HeroSectionProps = {
  isAuthenticated: boolean;
  locale: Locale;
  dict: LandingDictionary;
};

export function HeroSection({ isAuthenticated, locale, dict }: HeroSectionProps) {
  const { hero } = dict;

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="
        mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-14
        px-4 pt-10 pb-10 sm:px-8 sm:pt-14 lg:px-10
        xl:grid-cols-[1.15fr_1fr] xl:gap-10 xl:pb-8
      "
    >
      <div className="flex min-w-0 flex-col items-start gap-6 sm:gap-7">
        <h1
          id="hero-title"
          className="rise flex flex-col items-start gap-3 text-[clamp(2rem,8vw,4.5rem)] leading-[0.98] font-black tracking-tight uppercase xl:text-[4.8vw] 2xl:text-[4.25rem]"
          style={rise(0)}
        >
          <span>{hero.titleLine1}</span>{" "}
          <span className="brutal-lift text-[clamp(1.25rem,5.4vw,3.25rem)] xl:text-[3.3vw] 2xl:text-[2.9rem]">
            {hero.titleLine2}
          </span>
        </h1>

        <p
          className="rise max-w-xl text-base leading-relaxed font-semibold text-pretty text-muted sm:text-xl"
          style={rise(1)}
        >
          {hero.lead}
        </p>

        <div className="rise w-full sm:w-auto" style={rise(2)}>
          <Link
            href={isAuthenticated ? "/dashboard" : localePath(locale, "register")}
            className={buttonClasses({ variant: "primary", size: "lg", className: "group w-full sm:w-auto" })}
          >
            {isAuthenticated ? hero.ctaContinue : hero.ctaStart}
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5"
            >
              ↗
            </span>
          </Link>
          {/* The navbar has no room for "Log in" on phones; returning learners find it here. */}
          {!isAuthenticated && (
            <p className="mt-3 text-sm font-semibold text-muted sm:hidden">
              {hero.already}{" "}
              <Link
                href={localePath(locale, "login")}
                className="inline-flex min-h-11 items-center font-black text-fg underline decoration-[3px] underline-offset-4"
              >
                {hero.logIn}
              </Link>
            </p>
          )}
        </div>

        {/* Hidden on phones so the deck and the scroll arrow come up sooner. */}
        <ul
          className="rise hidden flex-wrap gap-x-5 gap-y-2 pt-2 text-sm font-black tracking-wide uppercase sm:flex"
          style={rise(3)}
        >
          {hero.facts.map((fact) => (
            <li key={fact} className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-2.5 border-2 border-line bg-mark" />
              {fact}
            </li>
          ))}
        </ul>
      </div>

      <div className="rise min-w-0" style={rise(2)}>
        <HeroDeck dict={dict} />
      </div>
    </section>
  );
}
