import type { ReactNode } from "react";
import { Award, Flame, Pin, Tags, TrendingUp } from "lucide-react";

import { badgeIcons, trackIcons } from "@/components/achievements/icons";
import { frameStyles, medalStyles } from "@/components/achievements/medals";
import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { BADGE_IDS, TRACK_IDS, TRACKS } from "@/features/achievements/achievements";
import { fill, type Locale } from "@/features/i18n/locales";
import { dateLocale, type PlatformDictionary } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { currentStreak, type PublicStats } from "@/features/profile/profile";
import { frameForLevel, levelTitle, medalForTier } from "@/features/rewards/levels";

const card = "border-[3px] border-line shadow-brutal";

type ProfileCardProps = {
  username: string | null;
  stats: PublicStats;
  today: string;
  locale: Locale;
  t: PlatformDictionary;
  action?: ReactNode; // e.g. the way back, at the card's top right
};

// Everything a profile shows, the same for the owner and for visitors:
// level, current streak, badges and milestone levels.
export function ProfileCard({ username, stats, today, locale, t, action }: ProfileCardProps) {
  const a = t.achievements;
  const p = t.profile;
  const streak = currentStreak(stats, today);
  const pinned = stats.showcase.filter((id) => stats.badges.includes(id));
  // Pinned badges first, in the order the learner chose.
  const badges = [...pinned, ...BADGE_IDS.filter((id) => stats.badges.includes(id) && !pinned.includes(id))];
  // Older snapshots have no equipped title or frame: follow the level.
  const frame = stats.frame === undefined ? frameForLevel(stats.level) : stats.frame;
  const title = t.rewards.titles[stats.title ?? levelTitle(stats.level).id];
  const tracks = TRACK_IDS.flatMap((id) => {
    const tier = stats.tracks[id] ?? 0;
    return tier > 0 ? [{ id, tier, total: TRACKS[id].length, reached: TRACKS[id][tier - 1] }] : [];
  });

  return (
    <div className="space-y-8">
      <section className={`flex flex-wrap items-center gap-5 bg-chip p-6 text-on-box sm:p-8 ${card}`}>
        <span
          aria-hidden="true"
          title={frame ? fill(p.frame, { medal: a.medals[frame] }) : undefined}
          className={`font-display flex h-20 w-20 shrink-0 items-center justify-center border-[3px] border-line bg-primary text-4xl font-black text-on-primary uppercase shadow-brutal-sm ${
            frame ? `outline-[6px] outline-offset-0 outline-solid ${frameStyles[frame]}` : ""
          }`}
        >
          {(username ?? "?").charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-black tracking-tight sm:text-4xl">
            {username ? `@${username}` : p.noUsername}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            <li className="inline-flex items-center gap-1.5 border-[2px] border-line bg-raised px-3 py-1 text-sm font-black text-fg uppercase shadow-brutal-sm">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              {fill(t.dashboard.level, { level: stats.level })}
            </li>
            <li
              className={`inline-flex items-center gap-1.5 border-[2px] border-line px-3 py-1 text-sm font-black uppercase shadow-brutal-sm ${
                frame ? medalStyles[frame] : "bg-raised text-fg"
              }`}
            >
              <Award className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{t.rewards.title}:</span>
              {title}
            </li>
            <li className="inline-flex items-center gap-1.5 border-[2px] border-line bg-raised px-3 py-1 text-sm font-black text-fg uppercase shadow-brutal-sm">
              <Flame className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{p.currentStreak}:</span>
              {plural(locale, streak, t.dashboard.days)}
            </li>
          </ul>
        </div>
        {action && <div className="self-start">{action}</div>}
      </section>

      <section aria-labelledby="profile-badges">
        <h2 id="profile-badges" className="mb-4 text-xl font-black uppercase">
          {a.badges} <span className="text-muted">· {badges.length}</span>
        </h2>
        {badges.length === 0 ? (
          <p className="font-semibold text-muted">{p.noBadges}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {badges.map((id, i) => {
              const Icon = badgeIcons[id];
              const isPinned = pinned.includes(id);
              return (
                <li
                  key={id}
                  className={`relative flex items-center gap-3 border-[3px] border-line p-3 ${
                    isPinned ? `shadow-brutal ${medalStyles.gold}` : `shadow-brutal-sm ${leitnerBoxStyles[(i % 4) + 1]}`
                  }`}
                >
                  {isPinned && (
                    <Pin
                      className="absolute -top-2.5 -right-2.5 h-6 w-6 rotate-12 border-[2px] border-line bg-raised p-0.5 text-fg"
                      role="img"
                      aria-label={p.showcaseTitle}
                    />
                  )}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-[2px] border-line bg-raised text-fg">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 text-sm leading-tight font-black uppercase">{a.badgeList[id].name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {stats.topics.length > 0 && (
        <section aria-labelledby="profile-topics">
          <h2 id="profile-topics" className="mb-4 text-xl font-black uppercase">
            {a.topicTitle} <span className="text-muted">· {stats.topics.length}</span>
          </h2>
          <ul className="flex flex-wrap gap-2">
            {stats.topics.map((topic) => (
              <li
                key={topic}
                className={`inline-flex items-center gap-1.5 border-[2px] border-line px-3 py-1 text-sm font-black uppercase shadow-brutal-sm ${medalStyles.gold}`}
              >
                <Tags className="h-4 w-4" aria-hidden="true" />
                {t.topics[topic]}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="profile-milestones">
        <h2 id="profile-milestones" className="mb-4 text-xl font-black uppercase">
          {a.milestones}
        </h2>
        {tracks.length === 0 ? (
          <p className="font-semibold text-muted">{p.noMilestones}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map(({ id, tier, total, reached }) => {
              const Icon = trackIcons[id];
              return (
                <li key={id} className="flex items-center gap-3 border-[3px] border-line bg-raised p-3 shadow-brutal-sm">
                  <span
                    title={a.medals[medalForTier(tier)!]}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center border-[2px] border-line ${medalStyles[medalForTier(tier)!]}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-tight font-black uppercase">{a.tracks[id].name}</span>
                    <span className="block text-xs font-bold text-muted">
                      {fill(p.reached, { target: reached.toLocaleString(dateLocale(locale)) })} ·{" "}
                      {fill(a.tierOf, { tier, total })}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
