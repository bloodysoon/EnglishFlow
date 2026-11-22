import type { LandingLanguage } from "./words";

// Every landing string, per language. Plain strings only ("{name}"
// placeholders are filled with `fill`), so slices of it can be passed to
// Client Components. TypeScript makes each dictionary complete.
export type LandingDictionary = {
  meta: { title: string; description: string };

  // Which translations of an English word this page shows.
  translationLanguages: LandingLanguage[];

  nav: {
    label: string;
    home: string;
    method: string;
    newWords: string;
    duels: string;
    review: string;
    sentences: string;
    start: string;
    logIn: string;
    dashboard: string;
    openDashboardFor: string; // {email}
    language: string;
    themeLabel: string;
    themeToLight: string;
    themeToDark: string;
  };

  // Button that stops the looping animations (WCAG 2.2.2).
  pauseMotion: string;

  hero: {
    titleLine1: string;
    titleLine2: string;
    lead: string;
    ctaStart: string;
    ctaMethod: string;
    facts: string[];
  };

  card: {
    box: string; // {box}
    dueToday: string;
    question: string;
    translation: string;
    gotIt: string;
    nextReview: string;
    xp: string;
  };

  how: {
    titleLine1: string;
    titleLine2: string;
    lead: string;
    box: string;
    boxOf: string; // {total}
    boxLabels: Record<1 | 2 | 3 | 4 | 5, string>;
    review: string; // {interval}
    rememberedTitle: string;
    rememberedText: string;
    forgotTitle: string;
    forgotText: string;
  };

  review: {
    titleLine1: string;
    titleLine2: string;
    lead: string;
    points: { title: string; text: string }[];
    // The sample eight days (src/components/landing/review-month.tsx).
    day: string; // {n}
    thinking: string; // "do you remember it?"
    gotIt: string; // the verdict stamps
    forgot: string;
    remembered: string; // {word} {from} {to}
    forgotten: string; // {word} {from} {to}
    nothingDue: string;
    nextUp: string; // {words} {n}: who comes back next, and when
    zeroMin: string; // the stamp on a day with nothing due
    calendarLabel: string;
  };

  // A worked example of sentence practice: one try with a mistake, one fixed.
  sentence: {
    titleLine1: string;
    titleLine2: string;
    lead: string;
    points: { title: string; text: string }[];
    prompt: string;
    firstTry: string;
    // The learner's first sentence, split around the mistaken word.
    before: string;
    mistake: string;
    after: string;
    hint: string;
    secondTry: string;
    fixed: string; // the whole corrected sentence, with the word in place
    fixedWord: string;
    noMistakes: string;
    tense: string;
  };

  // Duels, shown as one frozen round of a live match (src/components/duels/duel-match.tsx).
  duel: {
    titleLine1: string;
    titleLine2: string;
    lead: string;
    points: { title: string; text: string }[];
    round: string; // {n} {total}
    timeLeft: string;
    pick: string;
    you: string;
    theyAnswered: string; // {name}
  };

  // New words, dealt from a hanging badge deck as the page scrolls (src/components/landing/word-badge.tsx).
  triage: {
    titleLine1: string;
    titleLine2: string;
    lead: string;
    points: { title: string; text: string }[];
    question: string;
    know: string;
    learn: string;
    hint: string;
    known: string; // {n}
    toLearn: string; // {n}
    // Words of this section that fall into the boxes of "How it works":
    // the word, the box it lands in from lg (0: phones only), and where it
    // sits ("title", "lead", "points.0.title", "card", "hint",
    // "counter"). See FallText and FallingWords.
    // In each box, cards stand left to right in this list's order;
    // `right` packs that box's cards against its right side, half over each
    // other; `nudge` fine-tunes one card.
    falling: {
      word: string;
      box: number;
      place: string;
      right?: boolean;
      front?: boolean; // its card stands over its neighbours
      nudge?: number; // moves its card sideways, as a share of the box width (- left)
    }[];
  };

  cta: {
    titleLine1: string;
    titleStick: string;
    lead: string;
    reassure: string; // calm small print under the final call to action
    dashboard: string;
    already: string;
    logIn: string;
    // The receipt that prints at the end of the page (final-cta-section.tsx).
    receipt: {
      rows: { label: string; value: string }[];
      total: string;
      sum: string;
      thanks: string;
      stamp: string;
    };
  };

  footer: {
    tagline: string;
  };
};
