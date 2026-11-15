// A plain progress track. `tone` is the fill colour class (a theme token).
export function ProgressBar({
  label,
  value,
  max,
  tone,
  className = "mt-4 h-5 border-[3px]",
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`overflow-hidden border-line bg-surface ${className}`}
    >
      <div className={`h-full ${tone}`} style={{ width: `${percent}%` }} />
    </div>
  );
}
