import type { TranslationLanguage } from "@/features/i18n/locales";

export type LandingWord = {
  word: string;
  phonetic: string;
  example: string;
  translations: Record<TranslationLanguage, string>;
};

// The word that hops through the boxes in "How it works".
export const HOP_WORD: LandingWord = {
  word: "hello",
  phonetic: "/həˈləʊ/",
  example: "Hello, nice to meet you!",
  translations: { ru: "привет", ro: "salut" },
};

// The card on the hero deck.
export const HERO_WORD: LandingWord = {
  word: "resilient",
  phonetic: "/rɪˈzɪl.i.ənt/",
  example: "She stayed resilient after the setback.",
  translations: { ru: "стойкий", ro: "rezistent" },
};

// The sample review session, with the box each word starts in.
export const DEMO_WORDS: readonly (LandingWord & { box: number })[] = [
  {
    word: "eager",
    phonetic: "/ˈiː.ɡər/",
    example: "He was eager to start the course.",
    translations: { ru: "полный энтузиазма", ro: "nerăbdător" },
    box: 1,
  },
  {
    word: "borrow",
    phonetic: "/ˈbɒr.əʊ/",
    example: "Can I borrow your pen?",
    translations: { ru: "брать взаймы", ro: "a împrumuta" },
    box: 2,
  },
  {
    word: "whisper",
    phonetic: "/ˈwɪs.pər/",
    example: "She whispered the answer.",
    translations: { ru: "шептать", ro: "a șopti" },
    box: 3,
  },
  {
    word: "afford",
    phonetic: "/əˈfɔːd/",
    example: "We can't afford a new car yet.",
    translations: { ru: "позволить себе", ro: "a-și permite" },
    box: 1,
  },
  {
    word: "thorough",
    phonetic: "/ˈθʌr.ə/",
    example: "The doctor did a thorough check.",
    translations: { ru: "тщательный", ro: "minuțios" },
    box: 4,
  },
];

// Words in the ticker, each tagged with the box it sits in.
export const MARQUEE_WORDS = [
  { word: "resilient", box: 2 },
  { word: "although", box: 5 },
  { word: "borrow", box: 4 },
  { word: "eager", box: 1 },
  { word: "whisper", box: 3 },
  { word: "thorough", box: 1 },
  { word: "meanwhile", box: 4 },
  { word: "reliable", box: 3 },
  { word: "afford", box: 2 },
  { word: "curious", box: 5 },
] as const;
