import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Topic } from "@/features/dictionary/topics";
import { getHardWords, getLearningOverview, getStatistics } from "@/features/learning/queries";
import { activitySummary, longestStreak, reviewsOf } from "@/features/learning/statistics";
import { getWritingStats } from "@/features/writing/history";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { parseTimeZone, TIME_ZONE_COOKIE } from "@/lib/timezone";
import { achievements } from "./achievements";

type Extras = {
  nightReviews: number;
  earlyReviews: number;
  longestCleanRun: number;
  phoenixWords: number;
  topicMastered: Partial<Record<Topic, number>>;
};

const NO_EXTRAS: Extras = { nightReviews: 0, earlyReviews: 0, longestCleanRun: 0, phoenixWords: 0, topicMastered: {} };

// Secret and topic badge data, in the learner's time zone. Missing (no
// migration yet, or an error) means those badges just stay locked.
async function getExtras(supabase: SupabaseClient): Promise<Extras> {
  const timeZone = parseTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value);
  const { data, error } = await supabase.rpc("my_achievement_extras", { p_tz: timeZone });
  if (error) {
    logSupabaseError("[Achievements] Extras failed", error);
    return NO_EXTRAS;
  }
  const raw = (data ?? {}) as Record<string, unknown>;
  const topics = (raw.topics ?? {}) as Record<string, unknown>;
  return {
    nightReviews: Number(raw.night ?? 0),
    earlyReviews: Number(raw.early ?? 0),
    longestCleanRun: Number(raw.clean_run ?? 0),
    phoenixWords: Number(raw.phoenix ?? 0),
    topicMastered: Object.fromEntries(Object.entries(topics).map(([topic, n]) => [topic, Number(n)])),
  };
}

// Everything the achievement rules read, for the signed-in learner.
export async function getMyAchievements(supabase: SupabaseClient) {
  const [stats, overview, hardWords, writing, extras] = await Promise.all([
    getStatistics(supabase),
    getLearningOverview(supabase),
    getHardWords(supabase, 50),
    getWritingStats(supabase),
    getExtras(supabase),
  ]);
  const summary = activitySummary(stats.days);

  const result = achievements({
    days: stats.days,
    levels: stats.levels,
    perBox: overview.perBox,
    hardWords,
    // Frozen days keep a streak alive, so they count here too.
    longestStreak: longestStreak([...stats.days.map((d) => d.day), ...overview.frozenDays])?.length ?? 0,
    reviews: summary.reviews,
    accuracy: summary.accuracy,
    mastered: overview.mastered,
    words: overview.total,
    known: overview.known,
    xp: overview.xpTotal,
    level: overview.level.level,
    perfectDays: summary.perfectDays,
    bestDay: summary.bestDay ? reviewsOf(summary.bestDay) : 0,
    activeDays: summary.activeDays,
    ...writing,
    ...extras,
  });

  return { result, overview, stats };
}

// Share of learners holding each badge; null until enough learners have a
// snapshot for the numbers to mean something (and stay anonymous).
export const RARITY_MIN_LEARNERS = 20;

export async function getBadgeRarity(supabase: SupabaseClient): Promise<Record<string, number> | null> {
  const { data, error } = await supabase.rpc("badge_rarity");
  if (error) {
    logSupabaseError("[Achievements] Rarity failed", error);
    return null;
  }
  const raw = (data ?? {}) as { total?: unknown; counts?: Record<string, unknown> };
  const total = Number(raw.total ?? 0);
  if (total < RARITY_MIN_LEARNERS) return null;
  return Object.fromEntries(Object.entries(raw.counts ?? {}).map(([id, n]) => [id, Number(n) / total]));
}
