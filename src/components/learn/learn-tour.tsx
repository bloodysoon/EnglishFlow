"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";

// Each step spotlights the element with the matching data-tour attribute.
// In page order: review in the header, the toolbar, then the new-word card.
const STEPS = ["today", "words", "filters", "card"] as const;

const SEEN_KEY = "ef-learn-tour-seen";
const PAD = 6;
const GAP = 14; // between the spotlight and the card
const EDGE = 12; // keep the card this far from the screen edges

type Rect = { top: number; left: number; width: number; height: number; cardHeight: number };

export function LearnTour({ labels }: { labels: PlatformDictionary["tour"] }) {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Show once to new viewers; storage may be blocked, then it simply shows again.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (!seen) {
      const id = requestAnimationFrame(() => setStep(0));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  const close = useCallback(() => {
    setStep(null);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (step === null) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${STEPS[step]}"]`);
    const measure = () => {
      const r = el?.getBoundingClientRect();
      const cardHeight = cardRef.current?.offsetHeight ?? 220;
      setRect(r && r.width > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height, cardHeight } : null);
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A target taller than half the screen (the word card on a phone) is scrolled to its top, not centred.
    const tall = (el?.offsetHeight ?? 0) > window.innerHeight / 2;
    el?.scrollIntoView({ block: tall ? "start" : "center", behavior: reduce ? "auto" : "smooth" });
    const id = requestAnimationFrame(measure);
    nextRef.current?.focus();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    // The page's `rise` entrance still moves the target on the first frame.
    window.addEventListener("animationend", measure, true);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      window.removeEventListener("animationend", measure, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [step, close]);

  const current = step === null ? null : labels.steps[STEPS[step]];
  const last = step === STEPS.length - 1;
  // Card goes below the spotlight if it fits, else above, else it sits at the bottom of the screen.
  let place: React.CSSProperties = { top: "40%" };
  if (rect) {
    const vh = window.innerHeight;
    const bottom = rect.top + rect.height + PAD;
    if (bottom + GAP + rect.cardHeight <= vh - EDGE) place = { top: bottom + GAP };
    else if (rect.top - PAD - GAP - rect.cardHeight >= EDGE) place = { bottom: vh - rect.top + PAD + GAP };
    else place = { bottom: EDGE };
  }

  return (
    <>
      <Button size="toolbar" variant="secondary" onClick={() => setStep(0)} aria-label={labels.show}>
        <HelpCircle className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
      </Button>

      {/* Portal: the header row is animated (transform) and layered, which would trap a fixed overlay. */}
      {current &&
        createPortal(
          <div className="fixed inset-0 z-[60]">
            {/* Click outside the card skips the tour */}
            <div className="absolute inset-0" onClick={close} aria-hidden="true" />
            {rect && (
              <div
                aria-hidden="true"
                data-tour-spotlight=""
                className="pointer-events-none absolute border-[3px] border-primary shadow-[0_0_0_9999px_color-mix(in_srgb,var(--line)_65%,transparent)] transition-all duration-300 motion-reduce:transition-none"
                style={{
                  top: rect.top - PAD,
                  left: rect.left - PAD,
                  width: rect.width + PAD * 2,
                  height: rect.height + PAD * 2,
                }}
              />
            )}

            <div
              ref={cardRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tour-title"
              aria-describedby="tour-text"
              className="absolute inset-x-3 mx-auto max-w-sm border-[3px] border-line bg-raised p-4 text-fg shadow-brutal transition-[top,bottom] duration-300 motion-reduce:transition-none sm:p-5"
              style={place}
            >
              <p className="text-xs font-black tracking-widest text-muted uppercase">
                {fill(labels.stepOf, { current: step! + 1, total: STEPS.length })}
              </p>
              <h2 id="tour-title" className="mt-1 text-xl font-black uppercase">
                {current.title}
              </h2>
              <p id="tour-text" className="mt-1 font-semibold">
                {current.text}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 sm:mt-5">
                <button type="button" onClick={close} className="min-h-11 text-sm font-black uppercase hover:underline">
                  {labels.skip}
                </button>
                <div className="flex gap-2">
                  {step! > 0 && (
                    <Button size="sm" variant="secondary" onClick={() => setStep(step! - 1)}>
                      {labels.back}
                    </Button>
                  )}
                  <Button ref={nextRef} size="sm" onClick={() => (last ? close() : setStep(step! + 1))}>
                    {last ? labels.gotIt : labels.next}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
