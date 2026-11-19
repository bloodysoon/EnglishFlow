import type { TranslationLanguage } from "@/features/i18n/locales";

// Every landing string, per language. Plain strings only ("{name}"
// placeholders are filled with `fill`), so slices of it can be passed to
// Client Components. TypeScript makes each dictionary complete.
export type LandingDictionary = {
  meta: { title: string; description: string };

  // Which translations of an English word this page shows.
  translationLanguages: TranslationLanguage[];

  nav: {
    label: string;
    home: string;
    method: string;
    review: string;
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
    toStart: string;
    toTop: string;
  };

  hero: {
    sticker: string;
    titleLine1: string;
    titleLine2: string;
    lead: string;
    leadHighlight: string;
    ctaStart: string;
    ctaContinue: string;
    ctaMethod: string;
    facts: string[];
  };

  card: {
    box: string; // {box}
    dueToday: string;
    question: string;
    translation: string;
    gotIt: string;
    streak: string;
    xp: string;
  };

  how: {
    eyebrow: string;
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
    eyebrow: string;
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

  cta: {
    sticker: string;
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
