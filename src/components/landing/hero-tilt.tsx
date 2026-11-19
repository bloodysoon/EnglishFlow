"use client";

import type { PointerEvent, ReactNode } from "react";

const MAX_TILT_DEG = 12;

// Leans the hero deck toward the mouse. Writes CSS variables straight to
// the element (no React state), so moving the mouse never re-renders.
// Touch and reduced-motion keep the resting angle from globals.css.
export function HeroTilt({ children, className = "" }: { children: ReactNode; className?: string }) {
  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stage = event.currentTarget;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    stage.style.setProperty("--deck-rx", `${-y * MAX_TILT_DEG}deg`);
    stage.style.setProperty("--deck-ry", `${x * MAX_TILT_DEG}deg`);
  }

  function reset(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.removeProperty("--deck-rx");
    event.currentTarget.style.removeProperty("--deck-ry");
  }

  return (
    <div onPointerMove={tilt} onPointerLeave={reset} className={`deck-stage ${className}`}>
      {children}
    </div>
  );
}
