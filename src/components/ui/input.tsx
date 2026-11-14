import type { ComponentProps } from "react";

// Text input in the brutal style. Keyboard focus uses the global ring from
// globals.css; the offset shadow in the primary colour adds a second,
// pointer-visible cue.
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`min-h-12 w-full border-[3px] border-line bg-raised p-3 text-fg transition-shadow duration-150 placeholder:text-muted focus:shadow-[4px_4px_0_var(--primary)] aria-invalid:border-mark motion-reduce:transition-none ${className}`.trim()}
      {...props}
    />
  );
}

export function Label({ className = "", ...props }: ComponentProps<"label">) {
  return (
    <label
      className={`mb-2 block font-black text-fg uppercase ${className}`.trim()}
      {...props}
    />
  );
}
