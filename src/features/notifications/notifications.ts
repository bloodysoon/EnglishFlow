import type { achievements } from "@/features/achievements/achievements";
import { BADGE_IDS } from "@/features/achievements/achievements";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import type { Challenge } from "@/features/rewards/challenges";
import { levelTitle } from "@/features/rewards/levels";

export type NoticeKind = "badge" | "milestone" | "level" | "topic" | "challenge";
export type AchievementNotice = { key: string; kind: NoticeKind; title: string };
export type DueWord = { lemma: string; box: number };

// Which notification setting covers each kind.
export const NOTICE_SETTING: Record<NoticeKind, "badges" | "milestones"> = {
  badge: "badges",
  topic: "badges",
  milestone: "milestones",
  level: "milestones",
  challenge: "milestones",
};

// Everything earned so far, each with a stable key, so the browser can
// tell which ones it has already shown.
export function earnedNotices(
  result: ReturnType<typeof achievements>,
  level: number,
  challenges: Challenge[],
  t: Pick<PlatformDictionary, "achievements" | "rewards" | "notifications" | "topics">,
  monthName: (month: string) => string,
): AchievementNotice[] {
  const a = t.achievements;
  const badges = BADGE_IDS.filter((id) => result.badges[id]).map(
    (id): AchievementNotice => ({ key: `badge:${id}`, kind: "badge", title: a.badgeList[id].name }),
  );
  const milestones = result.tracks.flatMap((track) =>
    Array.from({ length: track.tier }, (_, i): AchievementNotice => ({
      key: `track:${track.id}:${i + 1}`,
      kind: "milestone",
      title: `${a.tracks[track.id].name} · ${fill(a.tierOf, { tier: i + 1, total: track.targets.length })}`,
    })),
  );
  // Level 1 is where everyone starts: nothing to announce.
  const levels = Array.from({ length: Math.max(0, level - 1) }, (_, i): AchievementNotice => {
    const n = i + 2;
    return {
      key: `level:${n}`,
      kind: "level",
      title: fill(t.notifications.levelReached, { level: n, title: t.rewards.titles[levelTitle(n).id] }),
    };
  });
  const topics = result.topics
    .filter((topic) => topic.earned)
    .map((topic): AchievementNotice => ({ key: `topic:${topic.id}`, kind: "topic", title: t.topics[topic.id] }));
  const months = challenges
    .filter((c) => c.done)
    .map((c): AchievementNotice => ({
      key: `challenge:${c.month}`,
      kind: "challenge",
      title: fill(a.challenges[c.kind], { target: c.target, month: monthName(c.month) }),
    }));
  return [...levels, ...badges, ...topics, ...months, ...milestones];
}

// The ones not seen yet. With no record at all (first visit, new device)
// everything already earned counts as seen, so the bell starts quiet.
export function unseenNotices(notices: AchievementNotice[], seen: string[] | null): AchievementNotice[] {
  if (seen === null) return [];
  const known = new Set(seen);
  return notices.filter((n) => !known.has(n.key));
}
