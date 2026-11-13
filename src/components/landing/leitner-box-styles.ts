// Visual identity per Leitner box: loud and warm while a word is new,
// calm and dark once it is mastered. Shared by every shelf on the landing.
export const leitnerBoxStyles: Record<number, string> = {
  1: "bg-brand-pink text-brand-ink",
  2: "bg-brand-orange text-brand-ink",
  3: "bg-brand-purple text-white",
  4: "bg-brand-green text-brand-ink",
  5: "bg-brand-ink text-brand-cream",
};

// One hop per box; the full cycle is LEITNER_BOXES.length * this (8s),
// matching the `leitner-hop` keyframes in globals.css.
export const LEITNER_HOP_STEP_SECONDS = 1.6;
