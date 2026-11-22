"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

const SMOOTHING = 0.1; // share of the gap closed each frame: lower is lazier

// A landing section played by scrolling. Writes the scroll progress (0 to 1,
// eased so it trails the wheel a little) to `--p` on the scene; the pieces
// inside animate from it in CSS (.scene-* in globals.css, timed with
// sceneStyle). The scene also pins for `length` extra screens (at the top
// from lg; on phones, where it is taller than the screen, at its bottom):
// progress runs from the moment it enters the screen to the end of the pin.
// Reduced motion: no pin, and the .scene-* rules don't apply, so all shows.
export function ScrollScene({
  length = 1,
  className = "",
  children,
}: {
  length?: number; // extra scroll while pinned, in screen heights
  className?: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!track || !pin) return;

    let target = 0;
    let current = 0;
    let frame = 0;

    function measure() {
      pin!.style.setProperty("--pin-h", `${pin!.offsetHeight}px`);
      const rect = track!.getBoundingClientRect();
      const range = track!.offsetHeight - pin!.offsetHeight;
      const top = parseFloat(getComputedStyle(pin!).top) || 0;
      let progress: number;
      if (range > 1) {
        // Pinned: from the top edge entering the screen to the pin's end.
        progress = (innerHeight - rect.top) / (innerHeight - top + range);
      } else {
        // Not pinned (phones): from entering the screen until its bottom nears the middle.
        progress = (innerHeight * 0.95 - rect.top) / (rect.height * 1.15);
      }
      target = Math.min(1, Math.max(0, progress));
    }

    function draw() {
      pin!.style.setProperty("--p", current.toFixed(4));
    }

    function tick() {
      current += (target - current) * SMOOTHING;
      if (Math.abs(target - current) < 0.0005) current = target;
      draw();
      frame = current === target ? 0 : requestAnimationFrame(tick);
    }

    function onScroll() {
      measure();
      if (!frame) frame = requestAnimationFrame(tick);
    }

    measure();
    current = target;
    draw();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className="scene-track"
      style={{ "--len": length } as CSSProperties}
    >
      <div ref={pinRef} className={`scene-pin ${className}`}>
        {children}
      </div>
      <div aria-hidden="true" className="scene-spacer hidden" />
    </div>
  );
}
