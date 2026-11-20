"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

import { MOTION_COOKIE, MOTION_COOKIE_MAX_AGE, MOTION_PAUSED } from "@/features/motion/motion";

// Pauses the landing's looping animations (WCAG 2.2.2): hover-to-pause
// alone is not reachable by keyboard or touch. The flag lives on <html>
// (set by the root layout from the cookie, so it holds across visits) and
// one CSS rule in globals.css covers every section. Hidden under reduced
// motion, where nothing loops anyway.
export function MotionToggle({ label, initialPaused }: { label: string; initialPaused: boolean }) {
  const [paused, setPaused] = useState(initialPaused);

  function toggle() {
    const next = !paused;
    setPaused(next);
    document.documentElement.toggleAttribute("data-motion-paused", next);
    document.cookie = next
      ? `${MOTION_COOKIE}=${MOTION_PAUSED}; path=/; max-age=${MOTION_COOKIE_MAX_AGE}; samesite=lax`
      : `${MOTION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      className="
        inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-black text-muted uppercase
        underline decoration-2 underline-offset-4 hover:text-fg hover:decoration-mark
        motion-reduce:hidden
      "
    >
      {paused ? (
        <Play aria-hidden="true" strokeWidth={2.75} className="h-4 w-4" />
      ) : (
        <Pause aria-hidden="true" strokeWidth={2.75} className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
