import type { CSSProperties } from "react";

// Timing for a .scene-* piece inside a ScrollScene: it plays while the
// scene's progress goes from `from` to `to` (both 0 to 1).
export function sceneStyle(
  from: number,
  to: number,
  extra?: CSSProperties,
): CSSProperties {
  return { "--a": from, "--b": to, ...extra } as CSSProperties;
}

// Text that lights up word by word (or types letter by letter) as the
// scene plays between `from` and `to`. Stays plain text for screen readers.
export function SceneText({
  text,
  from,
  to,
  by = "word",
  className = "",
}: {
  text: string;
  from: number;
  to: number;
  by?: "word" | "letter";
  className?: string;
}) {
  const parts = by === "word" ? text.split(/(\s+)/) : [...text];
  const count = parts.length || 1;
  const step = (to - from) / count;
  const piece = by === "word" ? "scene-word" : "scene-letter";

  return (
    <span className={className}>
      {parts.map((part, i) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <span
            key={i}
            className={piece}
            // Words fade over a few neighbours' time; letters just appear.
            style={sceneStyle(
              from + step * i,
              by === "word" ? from + step * (i + 4) : from + step * i + 0.001,
            )}
          >
            {part}
          </span>
        ),
      )}
    </span>
  );
}
