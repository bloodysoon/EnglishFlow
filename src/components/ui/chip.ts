// The brutal tag used for timeline events. `tone` is a background plus its
// text colour, e.g. "bg-box-3 text-on-box-3" (theme tokens).
export const chipClasses = (tone: string, interactive = false) =>
  `inline-flex flex-wrap items-center gap-x-1.5 border-[3px] border-line px-2.5 py-1 text-sm font-black shadow-brutal-sm ${tone} ${
    interactive
      ? "transition-transform hover:-translate-y-0.5 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-fg motion-reduce:transition-none"
      : ""
  }`.trim();
