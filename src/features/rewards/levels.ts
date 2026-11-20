// What a learner level brings: a title, cosmetic unlocks (accent colours,
// an avatar frame) and streak freezes. Cosmetics never change learning.

// A new title every few levels, spaced out as levels slow down.
// `from` is the first level that carries the title.
export const LEVEL_TITLES = [
  { id: "newcomer", from: 1 },
  { id: "starter", from: 2 },
  { id: "wordSeeker", from: 3 },
  { id: "explorer", from: 5 },
  { id: "apprentice", from: 7 },
  { id: "collector", from: 9 },
  { id: "wordsmith", from: 11 },
  { id: "storyteller", from: 13 },
  { id: "pathfinder", from: 15 },
  { id: "linguist", from: 18 },
  { id: "scholar", from: 21 },
  { id: "polyglot", from: 24 },
  { id: "sage", from: 28 },
  { id: "virtuoso", from: 32 },
  { id: "maestro", from: 36 },
  { id: "lexicon", from: 40 },
  { id: "oracle", from: 45 },
  { id: "luminary", from: 50 },
  { id: "grandmaster", from: 60 },
  { id: "mythic", from: 75 },
  { id: "legend", from: 100 },
] as const;

export type LevelTitleId = (typeof LEVEL_TITLES)[number]["id"];

export function levelTitle(level: number): { id: LevelTitleId; nextAt: number | null } {
  const index = LEVEL_TITLES.findLastIndex((t) => level >= t.from);
  const current = LEVEL_TITLES[Math.max(0, index)];
  return { id: current.id, nextAt: LEVEL_TITLES[index + 1]?.from ?? null };
}

// Accent colours (globals.css, [data-accent]); the first is the default.
export const ACCENTS = [
  { id: "forest", level: 1 },
  { id: "ocean", level: 5 },
  { id: "clay", level: 10 },
  { id: "plum", level: 15 },
  { id: "honey", level: 20 },
  { id: "midnight", level: 30 },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export const ACCENT_IDS = ACCENTS.map((a) => a.id) as AccentId[];
export const ACCENT_COOKIE = "ef-accent";

export function parseAccent(value: unknown): AccentId {
  return ACCENT_IDS.includes(value as AccentId) ? (value as AccentId) : "forest";
}

// Medals, shared by avatar frames and milestone tiers.
export const MEDALS = ["bronze", "silver", "gold", "platinum", "diamond"] as const;
export type Medal = (typeof MEDALS)[number];

// The n-th level of a milestone (1-based) earns the n-th medal; past the
// last medal it stays diamond.
export function medalForTier(tier: number): Medal | null {
  return tier < 1 ? null : MEDALS[Math.min(tier, MEDALS.length) - 1];
}

// Avatar frame by learner level.
export const FRAME_LEVELS: Record<Medal, number> = { bronze: 5, silver: 15, gold: 30, platinum: 50, diamond: 75 };

export function frameForLevel(level: number): Medal | null {
  return MEDALS.findLast((m) => level >= FRAME_LEVELS[m]) ?? null;
}

// One streak freeze per FREEZE_EVERY levels. A freeze fills a missed day
// automatically (public.use_streak_freezes, which repeats this rule).
export const FREEZE_EVERY = 5;

export function freezesEarned(level: number): number {
  return Math.floor(level / FREEZE_EVERY);
}
