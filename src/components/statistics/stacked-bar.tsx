// One horizontal bar split into parts (known, mastered, learning…), with
// the numbers in a box on hover, keyboard focus or tap.
export type BarPart = { tone: string; label: string; value: number };

export function StackedBar({
  parts,
  max,
  heading,
  label,
  format,
}: {
  parts: BarPart[];
  // The value a full bar stands for.
  max: number;
  heading: string; // first line of the box, e.g. "158 of 1,075"
  label: string; // what screen readers hear
  format: (n: number) => string;
}) {
  const width = (n: number) => `${(n / Math.max(max, 1)) * 100}%`;
  return (
    <span
      tabIndex={0}
      role="img"
      aria-label={label}
      className="group relative block cursor-default focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="flex h-6 overflow-hidden border-[2px] border-line bg-canvas">
        {parts.map((part) => (
          <span key={part.label} className={`block h-full ${part.tone}`} style={{ width: width(part.value) }} />
        ))}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden border-[2px] border-line bg-raised p-2 text-xs font-bold whitespace-nowrap text-fg shadow-brutal-sm group-hover:block group-focus:block"
      >
        <span className="mb-1 block font-black">{heading}</span>
        {parts.map((part) => (
          <span key={part.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 border-[2px] border-line ${part.tone}`} />
            {part.label}: <span className="font-black">{format(part.value)}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
