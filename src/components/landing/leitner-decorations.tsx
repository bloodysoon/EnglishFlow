export function LeitnerDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden overflow-hidden 2xl:block"
    >
      {/* Left top: first Leitner box */}
      <div className="hero-float absolute left-[3%] top-[16%]">
        <div className="-rotate-8 border-[3px] border-brand-ink bg-brand-purple px-5 py-3 text-center text-white shadow-[6px_6px_0_#171717]">
          <p className="text-xs font-black uppercase">Leitner system</p>
          <p className="mt-1 text-2xl font-black">BOX 01</p>
          <p className="text-xs font-bold">NEW WORDS</p>
        </div>
      </div>

      {/* Left bottom: review reminder */}
      <div className="hero-sway absolute bottom-[17%] left-[4%]">
        <div className="rotate-6 border-[3px] border-brand-ink bg-brand-pink px-5 py-3 text-center shadow-[6px_6px_0_#171717]">
          <p className="text-xl font-black uppercase">REVIEW DUE ↻</p>
          <p className="mt-1 text-xs font-bold">Time to remember!</p>
        </div>
      </div>

      {/* Right top: mastered box */}
      <div className="hero-float-delayed absolute right-[3%] top-[16%]">
        <div className="rotate-8 border-[3px] border-brand-ink bg-brand-green px-5 py-3 text-center shadow-[6px_6px_0_#171717]">
          <p className="text-xs font-black uppercase">Leitner system</p>
          <p className="mt-1 text-2xl font-black">BOX 05 ✓</p>
          <p className="text-xs font-bold">WELL PRACTICED</p>
        </div>
      </div>

      {/* Right bottom: long-term memory */}
      <div className="hero-sway-delayed absolute bottom-[17%] right-[3%]">
        <div className="-rotate-6 border-[3px] border-brand-ink bg-brand-cream px-5 py-3 text-center shadow-[6px_6px_0_#171717]">
          <p className="text-lg font-black uppercase">LONG-TERM MEMORY ★</p>
          <p className="mt-1 text-xs font-bold">Keep it fresh!</p>
        </div>
      </div>
    </div>
  );
}
