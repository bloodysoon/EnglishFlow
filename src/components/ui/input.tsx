import type { ComponentProps } from "react";

// Text input in the brutal style. Keyboard focus uses the global ring from
// globals.css; the purple offset shadow adds a second, pointer-visible cue.
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`w-full border-[3px] border-brand-ink bg-white p-3 text-brand-ink placeholder:text-neutral-500 focus:shadow-[4px_4px_0_var(--color-purple)] aria-invalid:border-brand-pink ${className}`.trim()}
      {...props}
    />
  );
}

export function Label({ className = "", ...props }: ComponentProps<"label">) {
  return (
    <label
      className={`mb-2 block font-black uppercase text-brand-ink ${className}`.trim()}
      {...props}
    />
  );
}
