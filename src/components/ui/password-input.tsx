"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

// Password field with a visible Show/Hide toggle. The toggle is a real
// button whose label says what it will do (no aria-pressed: the changing
// label already conveys state), so it works for keyboard,
// screen reader and touch users alike.
export function PasswordInput({
  id,
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & { id: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className={`pr-20 ${className}`.trim()}
        {...props}
      />
      <button
        type="button"
        aria-controls={id}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex min-w-16 cursor-pointer items-center justify-center border-l-[3px] border-brand-ink px-3 text-xs font-black uppercase text-brand-ink hover:bg-brand-cream focus-visible:outline-offset-[-6px]"
      >
        {visible ? "Hide" : "Show"}
        <span className="sr-only"> password</span>
      </button>
    </div>
  );
}
