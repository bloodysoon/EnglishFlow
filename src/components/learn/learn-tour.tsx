"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

// Each step spotlights the element with the matching data-tour attribute.
const STEPS = [
  { target: "add", title: "Add a word", text: "Type any word you want to learn. We fill in the meaning." },
  { target: "words", title: "My words", text: "Every word you add lives here." },
  { target: "sets", title: "Word sets", text: "Or start a ready-made set and get new words every day." },
  { target: "today", title: "Review", text: "Come back daily and review the words waiting for you." },
];

const SEEN_KEY = "ef-learn-tour-seen";
const PAD = 6;

type Rect = { top: number; left: number; width: number; height: number };

export function LearnTour() {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

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
    const el = document.querySelector<HTMLElement>(`[data-tour="${STEPS[step].target}"]`);
    const measure = () => {
      const r = el?.getBoundingClientRect();
      setRect(r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null);
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    const id = requestAnimationFrame(measure);
    nextRef.current?.focus();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      window.removeEventListener("keydown", onKey);
    };
  }, [step, close]);

  const current = step === null ? null : STEPS[step];
  const last = step === STEPS.length - 1;
  // Card goes below the spotlight, or above it when the target sits low on screen.
  const below = !rect || rect.top + rect.height / 2 < window.innerHeight / 2;

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setStep(0)} aria-label="Show the tour">
        <HelpCircle className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
        <span className="hidden sm:inline">Tour</span>
      </Button>

      {current && (
        <div className="fixed inset-0 z-50">
          {/* Click outside the card skips the tour */}
          <div className="absolute inset-0" onClick={close} aria-hidden="true" />
          {rect && (
            <div
              aria-hidden="true"
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
            role="dialog"
            aria-labelledby="tour-title"
            aria-describedby="tour-text"
            className="absolute inset-x-4 mx-auto max-w-sm border-[3px] border-line bg-raised p-5 text-fg shadow-brutal"
            style={
              rect
                ? below
                  ? { top: rect.top + rect.height + PAD + 16 }
                  : { bottom: window.innerHeight - rect.top + PAD + 16 }
                : { top: "40%" }
            }
          >
            <p className="text-xs font-black tracking-widest text-muted uppercase">
              Step {step! + 1} of {STEPS.length}
            </p>
            <h2 id="tour-title" className="mt-1 text-xl font-black uppercase">
              {current.title}
            </h2>
            <p id="tour-text" className="mt-1 font-semibold">
              {current.text}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" onClick={close} className="min-h-11 text-sm font-black uppercase hover:underline">
                Skip
              </button>
              <div className="flex gap-2">
                {step! > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => setStep(step! - 1)}>
                    Back
                  </Button>
                )}
                <Button ref={nextRef} size="sm" onClick={() => (last ? close() : setStep(step! + 1))}>
                  {last ? "Got it" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
