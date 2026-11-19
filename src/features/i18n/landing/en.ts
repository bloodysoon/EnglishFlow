import type { LandingDictionary } from "./types";

export const en: LandingDictionary = {
  meta: {
    title: "Elevo · Learn words. Remember forever.",
    description:
      "Learn English vocabulary with spaced repetition and the Leitner system. Practice a little every day.",
  },

  translationLanguages: ["ru", "ro"],

  nav: {
    label: "Main",
    home: "Elevo home",
    method: "The method",
    review: "Try a review",
    start: "Get started",
    logIn: "Log in",
    dashboard: "Dashboard",
    openDashboardFor: "Open dashboard for {email}",
    language: "Language",
    themeLabel: "Dark theme",
    themeToLight: "Switch to light theme",
    themeToDark: "Switch to dark theme",
  },

  pauseMotion: "Pause animations",

  scroll: {
    toMethod: "See the method",
    toReview: "Try a review",
    toStart: "Ready to start?",
    toTop: "Back to top",
  },

  hero: {
    sticker: "Flashcards that know when you'll forget",
    titleLine1: "Learn words.",
    titleLine2: "Remember forever.",
    lead: "Learn English vocabulary with spaced repetition: every word comes back right before you would forget it.",
    leadHighlight: "Practice a little. Remember a lot.",
    ctaStart: "Start learning free",
    ctaContinue: "Continue learning",
    ctaMethod: "See the method",
    facts: ["5 boxes", "1 simple rule", "A few minutes a day"],
  },

  card: {
    box: "Box {box}",
    dueToday: "Due today",
    question: "Do you know the translation?",
    translation: "Translation",
    gotIt: "Got it",
    streak: "7-day streak",
    xp: "+25 XP",
  },

  how: {
    eyebrow: "The Leitner method",
    titleLine1: "Five boxes.",
    titleLine2: "One rule.",
    lead: "Every word lives in one of five boxes. The better you know it, the further it moves and the less often you see it. Your time goes to the words you are about to forget.",
    box: "Box",
    boxOf: "of {total}",
    boxLabels: {
      1: "New words",
      2: "Getting there",
      3: "Sticking",
      4: "Almost yours",
      5: "Mastered",
    },
    review: "Review {interval}",
    progressNew: "New",
    progressMastered: "Mastered",
    rememberedTitle: "Remembered it?",
    rememberedText: "It moves up a box and comes back later.",
    forgotTitle: "Forgot it?",
    forgotText: "Back to Box 1, so you see it again tomorrow.",
  },

  review: {
    eyebrow: "Try it here",
    titleLine1: "A review takes",
    titleLine2: "minutes.",
    lead: "Flip the card, be honest, and watch each word move to its box. This is the whole daily routine.",
    points: [
      { title: "Only what's due", text: "Each day shows the words whose box says it's time, nothing else." },
      { title: "One honest tap", text: "Got it or forgot. The box does the scheduling for you." },
      { title: "Ready-made word sets", text: "Start from curated sets instead of building lists by hand." },
    ],
    wordOf: "Word {current} of {total}",
    done: "Done",
    doneTitle: "Review done ✓",
    summary: "Moved up: {up}. Back to Box 1: {back}. In the app, each word comes back on its own schedule.",
    showTranslation: "Show translation",
    forgot: "Forgot",
    gotIt: "Got it",
    tryAgain: "Try again",
    signUp: "Sign up",
    yourWords: "Your words",
    perBox: "Words per box",
    wordCount: "words: {count}",
    liveMoved: "{word} is now in Box {box}.",
    liveBack: "{word} went back to Box 1.",
  },

  cta: {
    sticker: "Your next chapter starts here ✳",
    titleLine1: "Ready to make your English",
    titleStick: "stick?",
    lead: "A few minutes a day make a big difference. Your journey starts with one word.",
    create: "Create a free account",
    dashboard: "Go to dashboard",
    already: "Already learning?",
    logIn: "Log in",
    stickers: ["You got this ⚡", "Let's go ✳", "Big progress ✓", "Start today ↗"],
  },

  footer: {
    tagline: "Make your English stick.",
    signUp: "Sign up",
  },
};
