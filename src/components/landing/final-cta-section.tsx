import Link from "next/link";
import { SectionScrollLink } from "./section-scroll-link";

type FinalCtaSectionProps = {
  isAuthenticated: boolean;
};

export function FinalCtaSection({ isAuthenticated }: FinalCtaSectionProps) {
  return (
    <section
      id="join-us"
      className="
        relative flex min-h-[calc(100dvh-83px)] scroll-mt-20
        flex-col items-center justify-center
        overflow-hidden border-t-[3px] border-brand-ink
        bg-brand-purple px-4
        pt-12 pb-36
        text-center text-white
        sm:px-8 sm:pt-16 sm:pb-40
      "
    >
      {/* Animated decorations */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          hidden overflow-hidden lg:block
        "
      >
        <div className="hero-float absolute left-[8%] top-[20%]">
          <div className="-rotate-12 border-[3px] border-brand-ink bg-brand-pink px-5 py-3 text-xl font-black text-brand-ink shadow-[6px_6px_0_#171717]">
            YOU GOT THIS! ⚡
          </div>
        </div>

        <div className="hero-float-delayed absolute right-[8%] top-[22%]">
          <div className="rotate-12 border-[3px] border-brand-ink bg-brand-cream px-5 py-3 text-xl font-black text-brand-ink shadow-[6px_6px_0_#171717]">
            LET&apos;S GO! ✳
          </div>
        </div>

        <div className="hero-sway absolute bottom-[17%] left-[12%]">
          <div className="rotate-6 border-[3px] border-brand-ink bg-brand-green px-5 py-3 text-lg font-black text-brand-ink shadow-[6px_6px_0_#171717]">
            BIG PROGRESS ✓
          </div>
        </div>

        <div className="hero-sway-delayed absolute bottom-[18%] right-[12%]">
          <div className="-rotate-6 border-[3px] border-brand-ink bg-brand-orange px-5 py-3 text-lg font-black text-brand-ink shadow-[6px_6px_0_#171717]">
            START TODAY ↗
          </div>
        </div>
      </div>

      {/* Main section content */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8">
        <span className="-rotate-3 border-[3px] border-brand-ink bg-brand-green px-4 py-2 text-xs font-black uppercase text-brand-ink shadow-[5px_5px_0_#171717] sm:text-sm">
          Your next chapter starts here ✳
        </span>

        <h2 className="text-[clamp(2.5rem,7vw,6rem)] leading-[0.98] font-black tracking-tighter uppercase">
          Ready to make
          <span className="block">your English</span>
          <span className="block text-brand-green">stick?</span>
        </h2>

        <p className="max-w-xl text-base leading-relaxed font-bold sm:text-xl">
          A few minutes a day can make a big difference.
          <span className="mt-2 block">Your journey starts with one word.</span>
        </p>

        <Link
          href={isAuthenticated ? "/dashboard" : "/register"}
          className="
            inline-flex items-center justify-center gap-3
            border-[3px] border-brand-ink
            bg-brand-green px-8 py-4
            text-base font-black uppercase text-brand-ink
            shadow-[7px_7px_0_#171717]
            transition-[transform,box-shadow,background-color] duration-200
            hover:-translate-y-1
            hover:bg-brand-cream
            hover:shadow-[10px_10px_0_#171717]
            active:translate-x-1 active:translate-y-1
            active:shadow-none
            focus-visible:outline-4
            focus-visible:outline-offset-4
            focus-visible:outline-brand-green
            motion-reduce:transition-none
          "
        >
          {isAuthenticated ? "Go to dashboard" : "Let's get started"}
          <span aria-hidden="true">↗</span>
        </Link>

        <p className="text-sm font-black uppercase tracking-widest">
          Free to start. Built to last.
        </p>
      </div>

      {/* Bottom scroll navigation */}
      <SectionScrollLink
        href="#top"
        label="Back to top"
        direction="up"
        variant="green"
      />
    </section>
  );
}
