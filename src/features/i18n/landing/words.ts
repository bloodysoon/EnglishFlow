import type { Locale } from "@/features/i18n/locales";

// The landing page's sample words are translated into every interface
// language, so each page shows its own (the app itself: see TranslationLanguage).
export type LandingLanguage = Exclude<Locale, "en">;

export type LandingWord = {
  word: string;
  phonetic: string;
  example: string;
  translations: Record<LandingLanguage, string>;
};

// The card on the hero deck.
export const HERO_WORD: LandingWord = {
  word: "resilient",
  phonetic: "/rɪˈzɪl.i.ənt/",
  example: "She stayed resilient after the setback.",
  translations: { ru: "стойкий", ro: "rezistent", id: "tangguh" },
};

// The sample review session, with the box each word starts in.
export const DEMO_WORDS: readonly (LandingWord & { box: number })[] = [
  {
    word: "eager",
    phonetic: "/ˈiː.ɡər/",
    example: "He was eager to start the course.",
    translations: { ru: "полный энтузиазма", ro: "nerăbdător", id: "bersemangat" },
    box: 1,
  },
  {
    word: "borrow",
    phonetic: "/ˈbɒr.əʊ/",
    example: "Can I borrow your pen?",
    translations: { ru: "брать взаймы", ro: "a împrumuta", id: "meminjam" },
    box: 2,
  },
  {
    word: "whisper",
    phonetic: "/ˈwɪs.pər/",
    example: "She whispered the answer.",
    translations: { ru: "шептать", ro: "a șopti", id: "berbisik" },
    box: 3,
  },
  {
    word: "afford",
    phonetic: "/əˈfɔːd/",
    example: "We can't afford a new car yet.",
    translations: { ru: "позволить себе", ro: "a-și permite", id: "mampu membeli" },
    box: 1,
  },
  {
    word: "thorough",
    phonetic: "/ˈθʌr.ə/",
    example: "The doctor did a thorough check.",
    translations: { ru: "тщательный", ro: "minuțios", id: "teliti" },
    box: 4,
  },
];

// Words in the ticker, each tagged with the box it sits in; they drop into
// those boxes in "How it works".
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

// The word in the frozen duel round on the landing page.
export const DUEL_WORD: LandingWord = {
  word: "journey",
  phonetic: "/ˈdʒɜː.ni/",
  example: "It was a long journey home.",
  translations: { ru: "путешествие", ro: "călătorie", id: "perjalanan" },
};

// The badge deck in the new-words section, top card first.
export const TRIAGE_WORDS: readonly LandingWord[] = [
  {
    word: "brave",
    phonetic: "/breɪv/",
    example: "It was brave of you to ask.",
    translations: { ru: "смелый", ro: "curajos", id: "berani" },
  },
  {
    word: "ladder",
    phonetic: "/ˈlæd.ər/",
    example: "He climbed the ladder to the roof.",
    translations: { ru: "лестница", ro: "scară", id: "tangga" },
  },
  {
    word: "although",
    phonetic: "/ɔːlˈðəʊ/",
    example: "Although it rained, we went out.",
    translations: { ru: "хотя", ro: "deși", id: "meskipun" },
  },
  {
    word: "rough",
    phonetic: "/rʌf/",
    example: "The sea was rough today.",
    translations: { ru: "грубый", ro: "aspru", id: "kasar" },
  },
  {
    word: "wonder",
    phonetic: "/ˈwʌn.dər/",
    example: "I wonder where she is.",
    translations: { ru: "задаваться вопросом", ro: "a se întreba", id: "bertanya-tanya" },
  },
];
