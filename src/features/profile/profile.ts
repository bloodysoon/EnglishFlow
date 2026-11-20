import { z } from "zod";

import { BADGE_IDS, TRACK_IDS, type achievements, type BadgeId } from "@/features/achievements/achievements";
import { TOPICS } from "@/features/dictionary/topics";
import { daysBetween } from "@/features/learning/statistics";

// Mirrors profiles_username_check in the database.
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/);

export const profileSettingsSchema = z.object({
  username: usernameSchema,
  isPublic: z.boolean(),
});

export type ProfileSettings = z.infer<typeof profileSettingsSchema>;

// Badges a learner may pin to the top of their profile.
export const SHOWCASE_MAX = 3;
export const showcaseSchema = z.array(z.enum(BADGE_IDS)).max(SHOWCASE_MAX).refine((ids) => new Set(ids).size === ids.length);

// What the public page may show: level, current streak, badges and
// milestone levels. Nothing else leaves the account.
export const publicStatsSchema = z.object({
  level: z.number().int().min(1),
  streak: z.number().int().min(0),
  // The day the streak was measured; it lapses if no practice since.
  streakDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  badges: z.array(z.enum(BADGE_IDS)),
  // Milestone levels reached, per track.
  tracks: z.partialRecord(z.enum(TRACK_IDS as [string, ...string[]]), z.number().int().min(0)),
  // Added later: older snapshots lack them.
  topics: z.array(z.enum(TOPICS)).default([]),
  showcase: z.array(z.enum(BADGE_IDS)).max(SHOWCASE_MAX).default([]),
});

export type PublicStats = z.infer<typeof publicStatsSchema>;

export function publicStats(
  result: ReturnType<typeof achievements>,
  level: number,
  streak: number,
  today: string,
  showcase: readonly BadgeId[] = [],
): PublicStats {
  return {
    level,
    streak,
    streakDay: today,
    badges: BADGE_IDS.filter((id) => result.badges[id]),
    tracks: Object.fromEntries(result.tracks.filter((t) => t.tier > 0).map((t) => [t.id, t.tier])),
    topics: result.topics.filter((t) => t.earned).map((t) => t.id),
    // Only badges actually earned can be pinned.
    showcase: showcase.filter((id) => result.badges[id]).slice(0, SHOWCASE_MAX),
  };
}

// A streak counts while its last day is today or yesterday (as on the
// dashboard); a snapshot taken longer ago shows 0.
export function currentStreak(stats: PublicStats, today: string): number {
  return daysBetween(stats.streakDay, today) <= 1 ? stats.streak : 0;
}
