import Link from "next/link";
import type { CSSProperties } from "react";

import { buttonClasses } from "@/components/ui/button";
import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import type { LandingDictionary } from "@/features/i18n/landing";
import { localePath, type Locale } from "@/features/i18n/locales";

type FinalCtaSectionProps = {
  isAuthenticated: boolean;
  locale: Locale;
  dict: LandingDictionary;
};

const STICKER_PLACES = [
  { className: "left-[4%] top-[12%] bg-box-1", tilt: "-8deg", delay: "0s" },
  { className: "right-[5%] top-[14%] bg-box-2", tilt: "7deg", delay: "0.8s" },
  { className: "bottom-[16%] left-[9%] bg-box-4", tilt: "5deg", delay: "1.6s" },
  { className: "bottom-[18%] right-[8%] bg-raised", tilt: "-5deg", delay: "0.4s" },
];

export function FinalCtaSection({ isAuthenticated, locale, dict }: FinalCtaSectionProps) {
  const { cta } = dict;

  return (
    <section
      id="join-us"
      aria-labelledby="join-us-title"
      className="
        relative flex min-h-[calc(100dvh-var(--navbar-height))] scroll-mt-(--navbar-height)
        flex-col items-center justify-center overflow-hidden
        bg-box-3 px-4 py-16 text-center text-on-box-3 sm:px-8
      "
    >
      {/* Floating stickers, only where there is room for them. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
        {STICKER_PLACES.map(({ className, tilt, delay }, i) => (
          <span
            key={className}
            className={`bob absolute border-[3px] border-line px-5 py-3 text-lg font-black text-on-box uppercase shadow-brutal ${className}`}
            style={{ "--tilt": tilt, "--delay": delay } as CSSProperties}
          >
            {cta.stickers[i]}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8">
        <span className="-rotate-2 border-[3px] border-line bg-raised px-4 py-2 text-xs font-black text-fg uppercase shadow-brutal-sm sm:text-sm">
          {cta.sticker}
        </span>

        <h2
          id="join-us-title"
          className="flex flex-col items-center gap-3 text-[clamp(1.75rem,6vw,4.75rem)] leading-[0.98] font-black tracking-tight uppercase"
        >
          <span>{cta.titleLine1}</span>{" "}
          <span className="brutal-lift text-[0.85em] text-fg sm:text-[1em]">{cta.titleStick}</span>
        </h2>

        <p className="max-w-xl text-base leading-relaxed font-semibold sm:text-xl">{cta.lead}</p>

        <Link
          href={isAuthenticated ? "/dashboard" : localePath(locale, "register")}
          className={buttonClasses({ variant: "primary", size: "lg", className: "group" })}
        >
          {isAuthenticated ? cta.dashboard : cta.create}
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5"
          >
            ↗
          </span>
        </Link>

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

        <SectionScrollLink href="#top" label={dict.scroll.toTop} direction="up" className="mt-4" />
      </div>
    </section>
  );
}
