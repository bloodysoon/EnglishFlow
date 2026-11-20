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

  scroll: {
    toMethod: string;
    toReview: string;
    toSentences: string;
    toStart: string;
    toTop: string;
  };

  hero: {
    titleLine1: string;
    titleLine2: string;
    lead: string;
    ctaStart: string;
    ctaContinue: string;
    ctaMethod: string;
    already: string;
    logIn: string;
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
    progressNew: string;
    progressMastered: string;
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
    wordOf: string; // {current} {total}
    done: string;
    doneTitle: string;
    summary: string; // {up} {back}
    showTranslation: string;
    forgot: string;
    gotIt: string;
    tryAgain: string;
    signUp: string;
    yourWords: string;
    perBox: string;
    wordCount: string; // {count}
    liveMoved: string; // {word} {box}
    liveBack: string; // {word}
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

  cta: {
    titleLine1: string;
    titleStick: string;
    lead: string;
    create: string;
    dashboard: string;
    already: string;
    logIn: string;
    stickers: [string, string, string, string];
  };

  footer: {
    tagline: string;
    signUp: string;
  };
};
