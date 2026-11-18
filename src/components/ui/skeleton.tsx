// A placeholder block with a shimmer (globals.css .skeleton), for loading
// states. `line` is a bare bar for text; otherwise it is a card outline.
export function Skeleton({ className = "", line = false }: { className?: string; line?: boolean }) {
  return <div aria-hidden="true" className={`skeleton ${line ? "skeleton--line" : ""} ${className}`} />;
}
