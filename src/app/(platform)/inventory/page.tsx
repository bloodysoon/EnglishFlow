import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Award, Check, Frame, MapPin, Palette, Snowflake, Zap } from "lucide-react";

import { frameStyles, medalStyles } from "@/components/achievements/medals";
import { EquipForm } from "@/components/inventory/equip-form";
import { AccentPicker } from "@/components/settings/accent-picker";
import { SettingsSection } from "@/components/settings/settings-section";
import { ProgressBar } from "@/components/ui/progress-bar";
import { riseStyle } from "@/components/ui/rise";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getLearningOverview } from "@/features/learning/queries";
import { XP_BOOST_MAX, XP_BOOST_PER_LEVEL, xpBoost } from "@/features/leitner/xp";
import { getEquipped } from "@/features/rewards/inventory";
import {
  ACCENT_COOKIE,
  FREEZE_EVERY,
  freezesEarned,
  parseAccent,
  resolveEquipped,
  rewardRoadmap,
  ROADMAP_MAX_LEVEL,
  type LevelReward,
} from "@/features/rewards/levels";
import { createClient } from "@/lib/supabase/server";

const card = "border-[3px] border-line shadow-brutal";

const KIND_ICONS = { title: Award, accent: Palette, frame: Frame, freeze: Snowflake, boost: Zap } as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.inventory };
}

export default async function InventoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [overview, equipped, cookieStore, { locale, t }] = await Promise.all([
    getLearningOverview(supabase),
    getEquipped(supabase, user.id),
    cookies(),
    getPlatformI18n(),
  ]);
  const inv = t.inventory;
  const r = t.rewards;
  const medals = t.achievements.medals;
  const { level } = overview;
  const shown = resolveEquipped(equipped, level.level);
  const earned = freezesEarned(level.level);
  const freezesLeft = Math.max(0, earned - overview.frozenDays.length);
  const roadmap = rewardRoadmap();
  const dayFormat = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", timeZone: "UTC" });

  const rewardName = (reward: LevelReward) => {
    switch (reward.kind) {
      case "title":
        return r.titles[reward.id];
      case "accent":
        return r.accents[reward.id];
      case "frame":
        return medals[reward.id];
      case "freeze":
        return inv.freezeReward;
      case "boost":
        return r.xpBoostReward;
    }
  };

  return (
    <div className="space-y-10">
      <header className="rise space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {inv.title}
          <span className="text-primary">.</span>
        </h1>
        <p className="max-w-xl font-semibold text-muted">{inv.lead}</p>
      </header>

      {/* Where I am */}
      <section className={`rise flex flex-wrap items-center gap-5 bg-chip p-6 text-on-box sm:p-8 ${card}`} style={riseStyle(1)}>
        <span
          aria-hidden="true"
          className={`font-display flex h-20 w-20 shrink-0 items-center justify-center border-[3px] border-line bg-primary text-3xl font-black text-on-primary shadow-brutal-sm ${
            shown.frame ? `outline-[6px] outline-solid ${frameStyles[shown.frame]}` : ""
          }`}
        >
          {level.level}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black tracking-wide uppercase">{fill(t.dashboard.level, { level: level.level })}</p>
          <p className="font-display text-2xl font-black tracking-tight uppercase sm:text-4xl">{r.titles[shown.title]}</p>
          <ProgressBar
            label={t.dashboard.nextLevelProgress}
            value={level.xpIntoLevel}
            max={level.xpForNextLevel}
            tone="bg-primary"
          />
          <p className="mt-2 text-sm font-bold">
            {fill(t.dashboard.xpToLevel, { xp: level.xpForNextLevel - level.xpIntoLevel, level: level.level + 1 })}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 border-[2px] border-line bg-raised px-2 py-1 text-xs font-black text-fg uppercase shadow-brutal-sm">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            {fill(r.xpBoost, { pct: Math.round(xpBoost(level.level) * 100) })}
          </p>
        </div>
      </section>

      {/* What I can use */}
      <div className="rise" style={riseStyle(2)}>
        <SettingsSection id="equipped" title={inv.equipTitle} description={inv.equipDescription}>
          <EquipForm
            initial={equipped}
            level={level.level}
            labels={{ inventory: inv, rewards: r, medals, sessionEnded: t.common.sessionEnded, unexpected: t.common.unexpected }}
          />
          <div className="border-t-[3px] border-dashed border-line pt-6">
            <AccentPicker initial={parseAccent(cookieStore.get(ACCENT_COOKIE)?.value)} level={level.level} t={r} />
          </div>
        </SettingsSection>
      </div>

      {/* Streak freezes */}
      <section aria-labelledby="freezes-heading" className={`rise bg-box-4 p-6 text-on-box ${card}`} style={riseStyle(3)}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="freezes-heading" className="text-lg font-black uppercase">
            {inv.freezesTitle}
          </h2>
          <Snowflake className="h-6 w-6" aria-hidden="true" />
        </div>
        {earned === 0 ? (
          <p className="mt-3 font-semibold">{fill(inv.freezesNone, { level: FREEZE_EVERY })}</p>
        ) : (
          <>
            <p className="font-display mt-4 text-3xl font-black">{plural(locale, freezesLeft, r.freezesLeft)}</p>
            <p className="mt-1 text-sm font-bold">{fill(inv.owned, { n: freezesLeft, total: earned })}</p>
            <p className="mt-3 text-sm font-semibold">
              {overview.frozenDays.length > 0
                ? fill(inv.frozenOn, {
                    days: overview.frozenDays.map((d) => dayFormat.format(new Date(`${d}T00:00:00Z`))).join(", "),
                  })
                : inv.notUsed}
            </p>
          </>
        )}
        <p className="mt-3 text-sm font-semibold">{fill(r.freezeHint, { every: FREEZE_EVERY })}</p>
      </section>

      {/* Everything a level brings */}
      <section aria-labelledby="roadmap-heading" className="rise" style={riseStyle(4)}>
        <h2 id="roadmap-heading" className="text-xl font-black uppercase">
          {inv.roadmapTitle}
        </h2>
        <p className="text-sm font-semibold text-muted">{fill(inv.roadmapLead, { to: ROADMAP_MAX_LEVEL })}</p>
        <p className="mb-5 text-sm font-semibold text-muted">
          {fill(r.xpBoostHint, {
            max: Math.round(XP_BOOST_MAX * 100),
            cap: 1 + Math.round(XP_BOOST_MAX / XP_BOOST_PER_LEVEL),
          })}
        </p>
        {level.level < roadmap[0].level && (
          <p className="mb-3 inline-flex items-center gap-1.5 border-[2px] border-line bg-mark px-2 py-1 text-xs font-black text-on-box uppercase shadow-brutal-sm">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {inv.youAreHere} · {fill(inv.levelN, { level: level.level })}
          </p>
        )}
        <ol className="space-y-3 border-l-[3px] border-line pl-5 sm:pl-7">
          {roadmap.map((step, i) => {
            const reached = level.level >= step.level;
            // The marker sits after the last level already reached.
            const here = reached && (roadmap[i + 1]?.level ?? Infinity) > level.level;
            return (
              <li key={step.level} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute top-3 -left-[calc(1.25rem+9px)] h-4 w-4 border-[3px] border-line sm:-left-[calc(1.75rem+9px)] ${
                    reached ? "bg-primary" : "bg-canvas"
                  }`}
                />
                <div
                  className={
                    reached
                      ? `flex flex-wrap items-center gap-2 bg-raised p-3 ${card}`
                      : "flex flex-wrap items-center gap-2 border-[3px] border-dashed border-line/60 p-3 text-muted"
                  }
                >
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 border-[2px] border-line px-2 py-1 text-xs font-black uppercase ${
                      reached ? "bg-primary text-on-primary" : "bg-canvas"
                    }`}
                  >
                    {reached && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
                    {fill(inv.levelN, { level: step.level })}
                    {reached && <span className="sr-only">· {inv.reached}</span>}
                  </span>
                  {step.rewards.map((reward) => {
                    const Icon = KIND_ICONS[reward.kind];
                    return (
                      <span
                        key={`${reward.kind}-${"id" in reward ? reward.id : step.level}`}
                        className={`inline-flex items-center gap-1.5 border-[2px] px-2 py-1 text-xs font-black ${
                          reached ? "border-line" : "border-dashed border-line/60"
                        } ${reached && reward.kind === "frame" ? medalStyles[reward.id] : ""}`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="sr-only">{inv.kinds[reward.kind]}:</span>
                        {rewardName(reward)}
                      </span>
                    );
                  })}
                </div>
                {here && (
                  <p className="mt-3 inline-flex items-center gap-1.5 border-[2px] border-line bg-mark px-2 py-1 text-xs font-black text-on-box uppercase shadow-brutal-sm">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {inv.youAreHere} · {fill(inv.levelN, { level: level.level })}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
