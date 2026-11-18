// Plain vertical bars for one series (weekday, hour). Thick borders and a
// marked peak keep it readable without colour; every bar has a tooltip.
type Props = {
  values: number[];
  labels: string[];
  // Shown under the chart only for these indexes, so 24 hours do not collide.
  tickEvery?: number;
  // Tooltip per bar, e.g. "Tue · 12 reviews".
  titles: string[];
  peak: number;
};

export function BarChart({ values, labels, tickEvery = 1, titles, peak }: Props) {
  const max = Math.max(1, ...values);

  return (
    <div>
      <ol className="flex h-36 items-end gap-[3px] border-b-[3px] border-line">
        {values.map((value, i) => (
          <li key={i} title={titles[i]} className="flex h-full min-w-0 flex-1 items-end">
            <span className="sr-only">{titles[i]}</span>
            {value > 0 && (
              <span
                aria-hidden="true"
                className={`w-full rounded-t-[4px] border-[2px] border-b-0 border-line ${i === peak ? "bg-primary" : "bg-box-4"}`}
                style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
              />
            )}
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className="mt-1 flex gap-[3px]">
        {labels.map((label, i) => (
          <span key={i} className="min-w-0 flex-1 text-center text-[10px] font-bold text-muted sm:text-xs">
            {i % tickEvery === 0 ? label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
