import { learnerLevel } from "@/features/leitner/xp";
import { activitySummary, longestStreak, reviewsOf, type DayActivity } from "@/features/learning/statistics";
import { achievements, BADGE_IDS, type BadgeId, type TrackId } from "./achievements";

export type TimelineWord = { id: string; lemma: string; known?: boolean };

// One day of my_timeline().
export type TimelineDay = DayActivity & {
  active: boolean; // any XP event that day
  mastered: number;
  levels: Record<string, number>; // reviews per CEFR level
  added: number;
  known: number;
  words: TimelineWord[]; // a sample of the words added
  // Words that arrived in each Leitner box that day (replayed in SQL).
  boxes: Record<number, { count: number; words: TimelineWord[] }>;
  // Sentences checked that day; clean = no mistakes and the asked tense.
  practice: { count: number; clean: number; words: TimelineWord[] };
};

export type Unlock = { kind: "track"; id: TrackId; target: number } | { kind: "badge"; id: BadgeId };

// When each achievement was first unlocked: the days are replayed one by
// one through the same rules as the achievements page.
// shortcut: box history and tenses are not replayed, so fullHouse,
// leechSlayer, tenseMaster and tensesUsed never get a date here, and "mastered" counts box-5 arrivals; store unlocks in a
// table if exact dates for those are wanted.
export function unlocksByDay(days: TimelineDay[]): Map<string, Unlock[]> {
  const activity: DayActivity[] = [];
  const levels = new Map<string, number>();
  const tiers = new Map<TrackId, number>();
  const earned = new Set<BadgeId>();
  const result = new Map<string, Unlock[]>();
  let words = 0;
  let known = 0;
  let mastered = 0;
  let xp = 0;
  let sentences = 0;
  let cleanSentences = 0;

  for (const d of [...days].sort((a, b) => (a.day < b.day ? -1 : 1))) {
    words += d.added;
    known += d.known;
    mastered += d.mastered;
    xp += d.xp;
    sentences += d.practice.count;
    cleanSentences += d.practice.clean;
    if (d.active) activity.push(d);
    for (const [level, n] of Object.entries(d.levels)) levels.set(level, (levels.get(level) ?? 0) + n);

    const summary = activitySummary(activity);
    const now = achievements({
      days: activity,
      levels: [...levels].map(([level, n]) => ({ level, remembered: n, forgot: 0 })),
      perBox: {},
      hardWords: [],
      longestStreak: longestStreak(activity.map((a) => a.day))?.length ?? 0,
      reviews: summary.reviews,
      accuracy: summary.accuracy,
      mastered,
      words,
      known,
      xp,
      level: learnerLevel(xp).level,
      perfectDays: summary.perfectDays,
      bestDay: summary.bestDay ? reviewsOf(summary.bestDay) : 0,
      activeDays: summary.activeDays,
      sentences,
      cleanSentences,
      tensesUsed: 0,
      wordTenses: 0,
      nightReviews: 0,
      earlyReviews: 0,
      longestCleanRun: 0,
      phoenixWords: 0,
      topicMastered: {},
    });

    const unlocks: Unlock[] = [];
    for (const track of now.tracks) {
      for (let i = tiers.get(track.id) ?? 0; i < track.tier; i++) {
        unlocks.push({ kind: "track", id: track.id, target: track.targets[i] });
      }
      tiers.set(track.id, Math.max(tiers.get(track.id) ?? 0, track.tier));
    }
    // A badge can be lost again (accuracy drops); only the first unlock counts.
    for (const id of BADGE_IDS) {
      if (now.badges[id] && !earned.has(id)) {
        earned.add(id);
        unlocks.push({ kind: "badge", id });
      }
    }
    if (unlocks.length > 0) result.set(d.day, unlocks);
  }
  return result;
}

// What a step of the day view needs here (DayStep fits).
type Step = {
  kind: "added" | "known" | "remembered" | "forgot" | "mastered" | "practice";
  at: string;
  xp: number;
  level: string | null; // CEFR level of the word
  practice?: { issues: unknown[]; tenseOk: boolean | null };
};

// The day as it stood after these steps, in my_timeline's shape.
export function dayUpTo(day: string, steps: Step[]): TimelineDay {
  const count = (kind: Step["kind"]) =>
    steps.filter((s) => s.kind === kind).length;
  const levels: Record<string, number> = {};
  for (const s of steps) {
    if ((s.kind === "remembered" || s.kind === "forgot") && s.level)
      levels[s.level] = (levels[s.level] ?? 0) + 1;
  }
  const practice = steps.flatMap((s) => (s.practice ? [s.practice] : []));
  return {
    day,
    // XP events: everything but adding a word and writing a sentence.
    active: steps.some((s) => s.kind !== "added" && s.kind !== "practice"),
    remembered: count("remembered"),
    forgot: count("forgot"),
    xp: steps.reduce((sum, s) => sum + s.xp, 0),
    mastered: count("mastered"),
    levels,
    added: count("added"),
    known: count("known"),
    words: [],
    boxes: {},
    practice: {
      count: practice.length,
      clean: practice.filter(
        (p) => p.issues.length === 0 && p.tenseOk !== false,
      ).length,
      words: [],
    },
  };
}

const unlockKey = (u: Unlock) =>
  u.kind === "track" ? `${u.id}-${u.target}` : u.id;

// When during the day each of its unlocks happened: the step after which it
// first shows up. at = null when no single step explains it (a day-level
// badge like comeback, or words removed since).
// shortcut: replays the whole history once per step (fine for hundreds of days); keep a running state if it gets slow.
export function unlockTimes(
  days: TimelineDay[],
  day: string,
  steps: Step[],
): { unlock: Unlock; at: string | null }[] {
  const all = unlocksByDay(days).get(day) ?? [];
  if (all.length === 0) return [];
  const wanted = new Set(all.map(unlockKey));
  const before = days.filter((d) => d.day < day);
  const found = new Map<string, { unlock: Unlock; at: string }>();
  for (let k = 1; k <= steps.length && found.size < wanted.size; k++) {
    for (const u of unlocksByDay([
      ...before,
      dayUpTo(day, steps.slice(0, k)),
    ]).get(day) ?? []) {
      const key = unlockKey(u);
      if (wanted.has(key) && !found.has(key))
        found.set(key, { unlock: u, at: steps[k - 1].at });
    }
  }
  return all.map(
    (unlock) => found.get(unlockKey(unlock)) ?? { unlock, at: null },
  );
}
