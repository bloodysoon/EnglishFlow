import type { Metadata } from "next";
import { CalendarCheck, Check, HelpCircle, Lock, Tags } from "lucide-react";
import { redirect } from "next/navigation";

import { badgeIcons, trackIcons } from "@/components/achievements/icons";
import { medalStyles } from "@/components/achievements/medals";
import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { ProgressBar } from "@/components/ui/progress-bar";
import { riseStyle } from "@/components/ui/rise";
import {
  ADVANCED_MIN,
  BADGE_IDS,
  CLEAN_SWEEP,
  COMEBACK_GAP,
  FLAWLESS_MIN,
  PERFECT_WEEK,
  PHOENIX_FALLS,
  SECRET_BADGES,
  SHARPSHOOTER,
  TOPIC_MASTERY,
  type BadgeId,
} from "@/features/achievements/achievements";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { getBadgeRarity } from "@/features/achievements/queries";
import { getAchievementsAndPublish } from "@/features/profile/queries";
import { monthlyChallenges } from "@/features/rewards/challenges";
import { medalForTier } from "@/features/rewards/levels";
import { TENSES } from "@/features/writing/tenses";
import { createClient } from "@/lib/supabase/server";

const card = "border-[3px] border-line shadow-brutal";

// Numbers the badge descriptions mention, from the rules themselves.
const badgeValues: Partial<Record<BadgeId, Record<string, number>>> = {
  comeback: { n: COMEBACK_GAP },
  flawless: { n: FLAWLESS_MIN },
  sharpshooter: { pct: SHARPSHOOTER.accuracy * 100, n: SHARPSHOOTER.minReviews },
  advanced: { n: ADVANCED_MIN },
  perfectWeek: { n: PERFECT_WEEK },
  tenseMaster: { n: TENSES.length },
  cleanSweep: { n: CLEAN_SWEEP },
  phoenix: { n: PHOENIX_FALLS },
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.achievements };
}

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ result, stats, overview }, { locale, t }, rarity] = await Promise.all([
    getAchievementsAndPublish(supabase, user.id),
    getPlatformI18n(),
    getBadgeRarity(supabase),
  ]);
  const a = t.achievements;
  const number = (n: number) => n.toLocaleString(dateLocale(locale));
  const percent = (share: number) => (share < 0.01 ? "<1" : String(Math.round(share * 100)));
  const challenges = monthlyChallenges(stats.days, overview.today);
  const monthFormat = new Intl.DateTimeFormat(dateLocale(locale), { month: "long", timeZone: "UTC" });
  const monthName = (month: string) => monthFormat.format(new Date(`${month}-01T00:00:00Z`));
  const current = challenges.current;

  // Earned badges first, each group in the defined order.
  const badgeOrder = [...BADGE_IDS].sort((x, y) => Number(result.badges[y]) - Number(result.badges[x]));

  return (
    <div className="space-y-10">
      <header className="rise space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {a.title}
          <span className="text-primary">.</span>
        </h1>
        <p className="max-w-xl font-semibold text-muted">{a.lead}</p>
      </header>

      {/* Overall */}
      <section
        aria-labelledby="overall-heading"
        className={`rise bg-chip p-6 text-on-box sm:p-8 ${card}`}
        style={riseStyle(1)}
      >
        <h2 id="overall-heading" className="text-xs font-black tracking-wide uppercase">
          {a.overall}
        </h2>
        <p className="font-display mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          {result.unlocked} <span className="text-[0.6em]">/ {result.total}</span>
        </p>
        <p className="mt-1 text-sm font-bold">{fill(a.unlocked, { n: result.unlocked, total: result.total })}</p>
        <ProgressBar label={a.overall} value={result.unlocked} max={result.total} tone="bg-primary" />
      </section>

      {/* Badges */}
      <section aria-labelledby="badges-heading" className="rise" style={riseStyle(2)}>
        <h2 id="badges-heading" className="mb-4 text-xl font-black uppercase">
          {a.badges}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badgeOrder.map((id, i) => {
            const earned = result.badges[id];
            const hidden = !earned && SECRET_BADGES.has(id);
            const Icon = hidden ? HelpCircle : badgeIcons[id];
            const { name, description } = hidden
              ? { name: a.secret, description: a.secretHint }
              : a.badgeList[id];
            const share = rarity?.[id] ?? (rarity ? 0 : null);
            return (
              <li
                key={id}
                className={
                  earned
                    ? `flex gap-4 p-5 ${card} ${leitnerBoxStyles[(i % 4) + 1]} ${i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"}`
                    : "flex gap-4 border-[3px] border-dashed border-line/60 bg-canvas p-5 text-muted"
                }
              >
                <span
                  className={`stamp flex h-14 w-14 shrink-0 items-center justify-center border-[3px] ${
                    earned ? "border-line bg-raised text-fg shadow-brutal-sm" : "border-dashed border-line/60"
                  }`}
                  style={riseStyle(i)}
                >
                  {earned || hidden ? (
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  ) : (
                    <Lock className="h-6 w-6" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-lg leading-tight font-black uppercase">{name}</span>
                  <span className="mt-1 block text-sm font-semibold">{fill(description, badgeValues[id] ?? {})}</span>
                  <span className="mt-2 flex flex-wrap gap-x-3 text-[10px] font-black tracking-wider uppercase">
                    <span>{earned ? `✓ ${a.earned}` : a.locked}</span>
                    {share !== null && !hidden && <span>{fill(a.rarity, { pct: percent(share) })}</span>}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Milestones */}
      <section aria-labelledby="milestones-heading" className="rise" style={riseStyle(3)}>
        <h2 id="milestones-heading" className="mb-4 text-xl font-black uppercase">
          {a.milestones}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.tracks.map((track) => {
            const Icon = trackIcons[track.id];
            const { name, goal } = a.tracks[track.id];
            const done = track.next === null;
            return (
              <li key={track.id} className={`flex flex-col bg-raised p-5 ${card}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg leading-tight font-black uppercase">{name}</h3>
                    <p className="mt-1 text-sm font-semibold text-muted">{goal}</p>
                  </div>
                  <span
                    title={track.tier > 0 ? a.medals[medalForTier(track.tier)!] : undefined}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-line ${
                      track.tier > 0 ? medalStyles[medalForTier(track.tier)!] : "bg-canvas text-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>

                {/* One block per level; reached levels are stamped in. */}
                <ol
                  className="mt-4 flex flex-wrap gap-1.5"
                  aria-label={fill(a.tierOf, { tier: track.tier, total: track.targets.length })}
                >
                  {track.targets.map((target, i) => (
                    <li
                      key={target}
                      title={number(target)}
                      className={`flex h-7 min-w-9 items-center justify-center border-[2px] px-1 text-[10px] font-black ${
                        i < track.tier
                          ? `stamp border-line ${medalStyles[medalForTier(i + 1)!]}`
                          : "border-dashed border-line/60 text-muted"
                      }`}
                      style={riseStyle(i)}
                    >
                      {compact(target)}
                    </li>
                  ))}
                </ol>

                <div className="mt-auto pt-4">
                  <div className="flex items-baseline justify-between gap-2 text-xs font-black uppercase">
                    <span>{fill(a.tierOf, { tier: track.tier, total: track.targets.length })}</span>
                    <span className="text-muted">
                      {done ? a.maxed : fill(a.progress, { value: number(track.value), target: number(track.next!) })}
                    </span>
                  </div>
                  <ProgressBar
                    label={name}
                    value={Math.round(track.toNext * 100)}
                    max={100}
                    tone={done ? "bg-box-3" : "bg-primary"}
                    className="mt-2 h-4 border-[3px]"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Monthly challenge */}
      <section aria-labelledby="challenge-heading" className="rise" style={riseStyle(4)}>
        <h2 id="challenge-heading" className="text-xl font-black uppercase">
          {a.challengeTitle}
        </h2>
        <p className="mb-4 text-sm font-semibold text-muted">{a.challengeLead}</p>
        <div className={`flex flex-col gap-4 p-5 sm:p-6 ${card} ${current.done ? "bg-chip text-on-box" : "bg-raised"}`}>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-line bg-box-2 text-on-box">
              <CalendarCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg leading-tight font-black uppercase">
                {fill(a.challenges[current.kind], { target: number(current.target), month: monthName(current.month) })}
              </p>
              <p className="mt-1 text-sm font-bold">
                {current.done
                  ? a.challengeDone
                  : `${fill(a.progress, { value: number(current.value), target: number(current.target) })} · ${fill(
                      a.challengeLeft,
                      { n: number(current.target - current.value) },
                    )}`}
              </p>
            </div>
          </div>
          <ProgressBar
            label={a.challengeTitle}
            value={Math.min(current.value, current.target)}
            max={current.target}
            tone={current.done ? "bg-box-3" : "bg-primary"}
          />
          {challenges.past.length > 0 && (
            <div>
              <h3 className="text-xs font-black tracking-wide uppercase">{a.pastChallenges}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {challenges.past.map((c) => (
                  <li
                    key={c.month}
                    title={fill(a.challenges[c.kind], { target: number(c.target), month: monthName(c.month) })}
                    className={`inline-flex items-center gap-1 border-[2px] px-2 py-1 text-xs font-black uppercase ${
                      c.done ? "stamp border-line bg-medal-gold text-on-box" : "border-dashed border-line/60 text-muted"
                    }`}
                  >
                    {c.done && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
                    {new Intl.DateTimeFormat(dateLocale(locale), { month: "short", year: "numeric", timeZone: "UTC" }).format(
                      new Date(`${c.month}-01T00:00:00Z`),
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Topic badges */}
      <section aria-labelledby="topics-heading" className="rise" style={riseStyle(5)}>
        <h2 id="topics-heading" className="text-xl font-black uppercase">
          {a.topicTitle}
        </h2>
        <p className="mb-4 text-sm font-semibold text-muted">{fill(a.topicLead, { n: TOPIC_MASTERY })}</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {[...result.topics]
            .sort((x, y) => Number(y.earned) - Number(x.earned) || y.mastered - x.mastered)
            .map((topic) => (
              <li
                key={topic.id}
                className={
                  topic.earned
                    ? `flex flex-col gap-2 p-3 ${card} bg-medal-gold text-on-box`
                    : "flex flex-col gap-2 border-[3px] border-dashed border-line/60 bg-canvas p-3 text-muted"
                }
              >
                <span className="flex items-center gap-2 text-sm leading-tight font-black uppercase">
                  {topic.earned ? (
                    <Tags className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="min-w-0">{t.topics[topic.id]}</span>
                </span>
                <span className="text-xs font-bold">
                  {topic.earned
                    ? `✓ ${a.earned}`
                    : fill(a.topicProgress, { value: Math.min(topic.mastered, TOPIC_MASTERY), target: TOPIC_MASTERY })}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

// 1000 → 1k, so seven level blocks fit on one row on phones.
function compact(n: number): string {
  return n >= 1000 ? `${n / 1000}k` : String(n);
}
