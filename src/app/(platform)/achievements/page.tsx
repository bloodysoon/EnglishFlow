import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { redirect } from "next/navigation";

import { badgeIcons, trackIcons } from "@/components/achievements/icons";
import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { ProgressBar } from "@/components/ui/progress-bar";
import { riseStyle } from "@/components/ui/rise";
import {
  ADVANCED_MIN,
  BADGE_IDS,
  COMEBACK_GAP,
  FLAWLESS_MIN,
  PERFECT_WEEK,
  SHARPSHOOTER,
  type BadgeId,
} from "@/features/achievements/achievements";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { getAchievementsAndPublish } from "@/features/profile/queries";
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
  const [{ result }, { locale, t }] = await Promise.all([
    getAchievementsAndPublish(supabase, user.id),
    getPlatformI18n(),
  ]);
  const a = t.achievements;
  const number = (n: number) => n.toLocaleString(dateLocale(locale));

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
            const Icon = badgeIcons[id];
            const earned = result.badges[id];
            const { name, description } = a.badgeList[id];
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
                  {earned ? (
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  ) : (
                    <Lock className="h-6 w-6" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-lg leading-tight font-black uppercase">{name}</span>
                  <span className="mt-1 block text-sm font-semibold">{fill(description, badgeValues[id] ?? {})}</span>
                  <span className="mt-2 inline-block text-[10px] font-black tracking-wider uppercase">
                    {earned ? `✓ ${a.earned}` : a.locked}
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
                    className={`flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-line ${
                      track.tier > 0 ? "bg-box-2 text-on-box" : "bg-canvas text-muted"
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
                          ? "stamp border-line bg-primary text-on-primary"
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
    </div>
  );
}

// 1000 → 1k, so seven level blocks fit on one row on phones.
function compact(n: number): string {
  return n >= 1000 ? `${n / 1000}k` : String(n);
}
