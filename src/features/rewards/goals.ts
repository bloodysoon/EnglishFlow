import type { TrackProgress } from "@/features/achievements/achievements";

// The milestones closest to their next level: the most motivating "one
// more push". Only tracks already started, so a new learner sees real goals.
export function closestGoals(tracks: TrackProgress[], count = 3): TrackProgress[] {
  return tracks
    .filter((t) => t.next !== null && t.value > 0)
    .sort((a, b) => b.toNext - a.toNext)
    .slice(0, count);
}
