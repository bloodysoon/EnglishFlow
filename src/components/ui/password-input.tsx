"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

// Password field with a visible Show/Hide toggle. The toggle is a real
// button whose label says what it will do (no aria-pressed: the changing
// label already conveys state), so it works for keyboard,
// screen reader and touch users alike.
type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  id: string;
  // Toggle wording in the page's language: "Show" / "Hide" + " password".
  labels?: { show: string; hide: string; suffix: string };
};

export function PasswordInput({
  id,
  className = "",
  labels = { show: "Show", hide: "Hide", suffix: "password" },
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className={`pr-28 ${className}`.trim()}
        {...props}
      />
      <button
        type="button"
        aria-controls={id}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex min-w-16 cursor-pointer items-center justify-center border-l-[3px] border-line px-3 text-xs font-black text-fg uppercase transition-colors duration-150 hover:bg-box-2 hover:text-on-box focus-visible:outline-offset-[-6px] motion-reduce:transition-none"
      >
        {visible ? labels.hide : labels.show}
        <span className="sr-only"> {labels.suffix}</span>
      </button>
    </div>
  );
}
