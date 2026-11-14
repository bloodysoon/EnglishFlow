// Visual identity per Leitner box: warm while a word is new, cool and
// deep once it is mastered. Theme-aware tokens (globals.css, section 2).
export const leitnerBoxStyles: Record<number, string> = {
  1: "bg-box-1 text-on-box",
  2: "bg-box-2 text-on-box",
  3: "bg-box-3 text-on-box-3",
  4: "bg-box-4 text-on-box",
  5: "bg-box-5 text-on-box-5",
};

// One hop per box; the full cycle is LEITNER_BOXES.length * this (8s),
// matching the `leitner-hop`, `box-active` and `track-fill` keyframes.
export const LEITNER_HOP_STEP_SECONDS = 1.6;
