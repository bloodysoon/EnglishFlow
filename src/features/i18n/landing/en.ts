import type { LandingDictionary } from "./types";

export const en: LandingDictionary = {
  meta: {
    title: "Elevo · Learn words. Remember forever.",
    description:
      "Learn English words from ready-made sets, use each one in your own sentences, and review it right before you would forget. Free to start.",
  },

  translationLanguages: ["ru", "ro"],

  nav: {
    label: "Main",
    home: "Elevo home",
    method: "The method",
    review: "Try a review",
    sentences: "Sentences",
    start: "Start",
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
    toSentences: "Then use it",
    toStart: "Ready to start?",
    toTop: "Back to top",
  },

  hero: {
    titleLine1: "Learn words.",
    titleLine2: "Remember forever.",
    lead: "Pick a ready-made word set, write your own sentences with each word, and every word comes back right before you would forget it.",
    ctaStart: "Start learning free",
    ctaContinue: "Continue learning",
    ctaMethod: "See the method",
    already: "Already learning?",
    logIn: "Log in",
    facts: ["Ready-made sets", "Your own sentences", "RU & RO translations", "Free to start"],
  },

  card: {
    box: "Box {box}",
    dueToday: "Due today",
    question: "Do you know the translation?",
    translation: "Translation",
    gotIt: "Got it",
    nextReview: "Next review in 3 days",
    xp: "+25 XP",
  },

  how: {
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
    titleLine1: "A review takes",
    titleLine2: "minutes.",
    lead: "Flip the card, be honest, and watch each word move to its box. A few minutes a day is enough.",
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

  sentence: {
    titleLine1: "Then use it",
    titleLine2: "in a sentence.",
    lead: "Knowing a word means using it. Write your own sentence with each word, and Elevo marks the mistakes and names the tense you used.",
    points: [
      { title: "Your words, your sentences", text: "Practise right on the word's page, as often as you like." },
      { title: "Mistakes marked", text: "Grammar and spelling are checked, with a suggestion for each mistake." },
      { title: "Tenses named", text: "See which tense you used, or pick one to practise." },
    ],
    prompt: "Write a sentence with this word",
    firstTry: "First try",
    before: "Yesterday I ",
    mistake: "borrow",
    after: " my sister's bike.",
    hint: "“Yesterday” is in the past: try “borrowed”.",
    secondTry: "Second try",
    fixed: "Yesterday I borrowed my sister's bike.",
    fixedWord: "borrowed",
    noMistakes: "No mistakes",
    tense: "Past Simple",
  },

  cta: {
    titleLine1: "Your first word set",
    titleStick: "is ready.",
    lead: "Pick a set, review a few words, write one sentence. That's a day's practice.",
    create: "Create a free account",
    dashboard: "Go to dashboard",
    already: "Already learning?",
    logIn: "Log in",
    stickers: ["Free to start", "No decks to build", "5 minutes a day", "EN · RU · RO"],
  },

  footer: {
    tagline: "Learn words. Remember forever.",
    signUp: "Sign up",
  },
};
