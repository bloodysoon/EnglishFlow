import type { SupabaseClient } from "@supabase/supabase-js";

import { getHardWords, getLearningOverview, getStatistics } from "@/features/learning/queries";
import { activitySummary, longestStreak, reviewsOf } from "@/features/learning/statistics";
import { getWritingStats } from "@/features/writing/history";
import { achievements } from "./achievements";

// Everything the achievement rules read, for the signed-in learner.
export async function getMyAchievements(supabase: SupabaseClient) {
  const [stats, overview, hardWords, writing] = await Promise.all([
    getStatistics(supabase),
    getLearningOverview(supabase),
    getHardWords(supabase, 50),
    getWritingStats(supabase),
  ]);
  const summary = activitySummary(stats.days);

  const result = achievements({
    days: stats.days,
    levels: stats.levels,
    perBox: overview.perBox,
    hardWords,
    longestStreak: longestStreak(stats.days.map((d) => d.day))?.length ?? 0,
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
  });

  return { result, overview };
}
