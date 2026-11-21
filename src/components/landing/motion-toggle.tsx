"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

import { MOTION_COOKIE, MOTION_COOKIE_MAX_AGE, MOTION_PAUSED } from "@/features/motion/motion";

// Pauses the landing's looping animations (WCAG 2.2.2): hover-to-pause
// alone is not reachable by keyboard or touch. The flag lives on <html>
// (set by the root layout from the cookie, so it holds across visits) and
// one CSS rule in globals.css covers every section. A square button on the
// word ticker, its name in aria-label and the tooltip. Hidden under reduced
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
      aria-label={label}
      title={label}
      className="
        lift-safe flex h-11 w-11 cursor-pointer items-center justify-center
        border-[3px] border-line bg-raised text-fg shadow-brutal-sm
        transition-[transform,background-color] duration-150 hover:-translate-y-0.5
        aria-pressed:bg-box-2 aria-pressed:text-on-box
        motion-reduce:hidden motion-reduce:transition-none
      "
    >
      {paused ? (
        <Play aria-hidden="true" strokeWidth={2.75} className="h-4 w-4" />
      ) : (
        <Pause aria-hidden="true" strokeWidth={2.75} className="h-4 w-4" />
      )}
    </button>
  );
}
