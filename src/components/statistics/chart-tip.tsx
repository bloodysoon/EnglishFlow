// Hover box for a chart mark, in the brutal style. The mark needs
// `group relative` and tabIndex={-1}, so a tap (focus) shows it on phones
// too. Screen readers get the same text elsewhere (sr-only or aria-label).
// `align` keeps boxes near the edges inside the card.
export function ChartTip({ text, align = "start" }: { text: string; align?: "start" | "end" }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden border-[2px] border-line bg-raised px-2 py-1 text-xs font-black whitespace-nowrap text-fg shadow-brutal-sm group-hover:block group-focus:block ${
        align === "end" ? "right-0" : "left-0"
      }`}
    >
      {text}
    </span>
  );
}

// Marks in the right half open their box to the left.
export const tipAlign = (index: number, count: number) => (index < count / 2 ? "start" : "end");

export const tipMark = "group relative outline-none focus-visible:outline-3 focus-visible:outline-primary";
