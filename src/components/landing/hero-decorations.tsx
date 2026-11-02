export function HeroDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden overflow-hidden xl:block"
    >
      {/* LEFT TOP: ABC sticker */}
      <div className="hero-float absolute left-[5%] top-[15%]">
        <div className="-rotate-12 border-[3px] border-brand-ink bg-brand-green px-5 py-3 text-3xl font-black shadow-[6px_6px_0_#171717]">
          ABC ✳
        </div>
      </div>

      {/* LEFT MIDDLE: Vocabulary flashcard */}
      <div className="hero-sway absolute left-[3%] top-[48%]">
        <div className="relative -rotate-6 border-[3px] border-brand-ink bg-brand-cream px-5 py-4 text-left shadow-[7px_7px_0_#171717]">
          <span className="absolute -top-3 right-3 rotate-6 border-2 border-brand-ink bg-brand-pink px-2 py-0.5 text-[10px] font-black uppercase">
            New word!
          </span>

          <p className="text-2xl font-black uppercase tracking-tight">Hello!</p>

          <p className="mt-1 text-sm font-bold text-brand-ink/70">/həˈloʊ/</p>

          <div className="mt-3 border-t-2 border-dashed border-brand-ink pt-2 text-xs font-black uppercase">
            Say it out loud ↗
          </div>
        </div>
      </div>

      {/* LEFT BOTTOM: Mastered word */}
      <div className="hero-float-delayed absolute bottom-[12%] left-[14%]">
        <div className="-rotate-6 border-[3px] border-brand-ink bg-brand-purple px-4 py-3 text-sm font-black uppercase text-white shadow-[5px_5px_0_#171717]">
          ✓ Word mastered
        </div>
      </div>

      {/* RIGHT TOP: Level up sticker */}
      <div className="hero-float-delayed absolute right-[5%] top-[18%]">
        <div className="rotate-12 border-[3px] border-brand-ink bg-brand-pink px-5 py-3 text-xl font-black uppercase shadow-[6px_6px_0_#171717]">
          LEVEL UP! ⚡
        </div>
      </div>

      {/* RIGHT MIDDLE: Streak card */}
      <div className="hero-sway-delayed absolute right-[4%] top-[49%]">
        <div className="rotate-6 border-[3px] border-brand-ink bg-brand-green px-5 py-4 text-center shadow-[7px_7px_0_#171717]">
          <p className="text-xs font-black uppercase tracking-widest">
            Your streak
          </p>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-4xl font-black">07</span>
            <span className="hero-flame text-3xl">🔥</span>
          </div>

          <p className="mt-1 text-xs font-black uppercase">Days in a row!</p>
        </div>
      </div>

      {/* RIGHT BOTTOM: Experience points */}
      <div className="hero-float absolute bottom-[12%] right-[14%]">
        <div className="rotate-6 border-[3px] border-brand-ink bg-brand-cream px-5 py-3 text-lg font-black uppercase shadow-[5px_5px_0_#171717]">
          +25 XP ★
        </div>
      </div>
    </div>
  );
}
