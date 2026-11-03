import Link from "next/link";

import { HeroDecorations } from "@/components/landing/hero-decorations";
import { SectionScrollLink } from "./section-scroll-link";

type HeroSectionProps = {
  isAuthenticated: boolean;
};

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col items-center justify-center px-4 pb-28 pt-10 text-center sm:px-8 sm:pb-32">
      <HeroDecorations />

      <div className="relative z-10 flex w-full flex-col items-center gap-7">
        <span className="brutal-sticker text-xs sm:text-sm">
          No more boring flashcards
          <span className="brutal-sticker__icon" aria-hidden="true">
            ✳
          </span>
        </span>

        <h1 className="flex w-full max-w-5xl flex-col items-center gap-3 text-[clamp(2rem,6vw,5.5rem)] leading-[0.98] font-black tracking-tighter uppercase">
          <span>Learn words.</span>

          <span className="brutal-lift text-[clamp(1.3rem,5vw,4.5rem)]">
            Remember forever.
          </span>
        </h1>

        <p className="max-w-xl text-base leading-relaxed font-bold sm:text-xl">
          Learn English smarter with spaced repetition.
          <span className="mt-2 block">
            <span className="brutal-highlight">
              Practice a little.
              <span className="brutal-highlight__bolt" aria-hidden="true">
                ⚡
              </span>
            </span>
          </span>
          <span className="block">Remember a lot.</span>
        </p>

        <Link
          href={isAuthenticated ? "/dashboard" : "/register"}
          className="
            inline-flex items-center gap-3
            border-[3px] border-brand-ink
            bg-brand-purple px-7 py-4
            text-base font-black uppercase text-white
            shadow-[6px_6px_0_#171717]
            transition-[transform,box-shadow] duration-150
            hover:-translate-y-1
            hover:shadow-[8px_8px_0_#171717]
            active:translate-x-1 active:translate-y-1
            active:shadow-none
            focus-visible:outline-4
            focus-visible:outline-offset-4
            focus-visible:outline-brand-ink
            motion-reduce:transition-none
          "
        >
          {isAuthenticated ? "Continue learning" : "Start learning"}
          <span aria-hidden="true">↗</span>
        </Link>

        <p className="text-sm font-bold">
          Small steps. Big progress. No boring stuff.
        </p>
      </div>

      <SectionScrollLink
        href="#how-it-works"
        label="Explore the method"
        variant="green"
      />
    </section>
  );
}
