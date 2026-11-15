import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Headphones,
  Languages,
  Layers3,
  LockKeyhole,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { buttonClasses } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { riseStyle } from "@/components/ui/rise";
import { getLandingDictionary } from "@/features/i18n/landing";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getLearningOverview } from "@/features/learning/queries";
import { introduceTodaysWords } from "@/features/learning/server";
import { effectiveDailyGoal, getPlan } from "@/features/subscription/plans";
import { LEITNER_BOXES } from "@/features/leitner/boxes";
import { getLearningSettings } from "@/features/settings/profile";
import { createClient } from "@/lib/supabase/server";

const card = "border-[3px] border-line shadow-brutal";

const exercises = [
  { key: "vocabulary", icon: Layers3, tone: "bg-box-5 text-on-box-5", href: "/learn" },
  { key: "grammar", icon: BookOpen, tone: "bg-raised text-fg", href: null },
  { key: "listening", icon: Headphones, tone: "bg-box-1 text-on-box", href: null },
  { key: "translation", icon: Languages, tone: "bg-box-4 text-on-box", href: null },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.dashboard };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  await introduceTodaysWords(supabase);
  const [overview, { settings }, plan, { locale, t }] = await Promise.all([
    getLearningOverview(supabase),
    getLearningSettings(),
    getPlan(supabase),
    getPlatformI18n(),
  ]);
  const d = t.dashboard;
  const boxLabels = getLandingDictionary(locale).how.boxLabels;
  const dailyGoal = effectiveDailyGoal(plan, settings.dailyGoal);

  const { level, streak, dueToday, total, mastered, perBox } = overview;
  const newToday = Math.min(overview.introducedToday, dailyGoal);

  const next =
    dueToday > 0
      ? { title: plural(locale, dueToday, d.waiting), cta: d.startReview, href: "/learn/review" }
      : total === 0
        ? { title: d.pickFirst, cta: d.chooseSet, href: "/learn" }
        : { title: d.allDone, cta: d.browseSets, href: "/learn" };

  return (
    <div className="space-y-10">
      <h1 className="rise text-3xl font-black tracking-tight uppercase sm:text-4xl" style={riseStyle(0)}>
        {d.title}
        <span className="text-primary">.</span>
      </h1>

      {/* What to do next */}
      <section
        aria-labelledby="next-heading"
        className={`rise relative overflow-hidden bg-chip p-6 text-on-box sm:p-9 ${card}`}
        style={riseStyle(1)}
      >
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block -rotate-2 border-[2px] border-line bg-raised px-3 py-1 text-xs font-black text-fg uppercase shadow-brutal-sm">
            {streak > 0 ? plural(locale, streak, d.streakBadge) : d.firstStepBadge}
          </span>
          <h2
            id="next-heading"
            className="mt-6 flex flex-col items-start gap-3 text-3xl leading-tight font-black tracking-tight uppercase sm:text-5xl"
          >
            <span>{d.welcome}</span>
            <span className="brutal-lift text-[0.7em] whitespace-normal text-fg">{next.title}</span>
          </h2>
          <Link href={next.href} className={buttonClasses({ size: "lg", className: "group mt-7" })}>
            {next.cta}
            <ArrowRight
              className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Link>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -bottom-14 hidden text-[15rem] leading-none font-black text-on-box opacity-15 xl:block"
        >
          ✳
        </div>
      </section>

      {/* Stats */}
      <section aria-labelledby="progress-heading" className="rise" style={riseStyle(2)}>
        <h2 id="progress-heading" className="mb-4 text-xl font-black uppercase">
          {d.progress}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className={`bg-box-2 p-5 text-on-box ${card}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black tracking-wide uppercase">{d.streak}</p>
              <Flame className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="font-display mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              {plural(locale, streak, d.days)}
            </p>
            <p className="mt-2 text-sm font-semibold">{streak > 0 ? d.keepGoing : d.startStreak}</p>
          </article>

          <article className={`bg-box-3 p-5 text-on-box-3 ${card}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black tracking-wide uppercase">{d.totalXp}</p>
              <Zap className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="font-display mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              {overview.xpTotal.toLocaleString(dateLocale(locale))}
            </p>
            <p className="mt-2 text-sm font-semibold">{fill(d.levelLearner, { level: level.level })}</p>
          </article>

          <article className={`bg-raised p-5 text-fg ${card}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black tracking-wide uppercase">{d.mastered}</p>
              <Trophy className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="font-display mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              {mastered} / {total}
            </p>
            <p className="mt-2 text-sm font-semibold">{fill(d.inBox, { box: LEITNER_BOXES.length })}</p>
          </article>

          <article className={`bg-box-4 p-5 text-on-box ${card}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black tracking-wide uppercase">{d.known}</p>
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="font-display mt-5 text-3xl font-black tracking-tight sm:text-4xl">{overview.known}</p>
            <Link
              href="/learn/known"
              className="mt-2 inline-block text-sm font-semibold underline decoration-2 underline-offset-2 hover:decoration-mark"
            >
              {d.knownHint}
            </Link>
          </article>
        </div>
      </section>

      {/* Boxes */}
      <section aria-labelledby="boxes-heading" className="rise" style={riseStyle(3)}>
        <h2 id="boxes-heading" className="mb-4 text-xl font-black uppercase">
          {d.boxes}
        </h2>
        <ol className="grid grid-cols-5 gap-2 sm:gap-4">
          {LEITNER_BOXES.map(({ box }) => (
            <li
              key={box}
              className={`flex flex-col items-center border-[3px] border-line px-1 py-3 shadow-brutal-sm sm:py-4 ${leitnerBoxStyles[box]}`}
            >
              <span className="text-[10px] font-black tracking-wider uppercase sm:text-xs">{fill(d.box, { box })}</span>
              <span className="font-display text-2xl font-black sm:text-4xl">{perBox[box] ?? 0}</span>
              <span className="hidden text-center text-xs font-bold sm:block">{boxLabels[box]}</span>
            </li>
          ))}
        </ol>
        {overview.queued > 0 && (
          <p className="mt-3 text-sm font-semibold text-muted">{plural(locale, overview.queued, d.queued)}</p>
        )}
      </section>

      {/* Daily goal and level */}
      <section className="grid gap-5 lg:grid-cols-2">
        <article className={`bg-raised p-6 ${card}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase">{d.dailyGoal}</h2>
            <Target className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="font-display text-3xl font-black">
              {newToday} / {dailyGoal}
            </p>
            <span className="text-xs font-black uppercase">{d.newToday}</span>
          </div>
          <ProgressBar label={d.newToday} value={newToday} max={dailyGoal} tone="bg-box-3" />
          <p className="mt-3 text-sm font-semibold text-muted">
            {dueToday > 0 ? fill(d.toReview, { n: dueToday }) : d.nothingToReview}{" "}
            <Link
              href="/settings"
              className="font-black underline decoration-2 underline-offset-2 hover:decoration-mark"
            >
              {d.changeGoal}
            </Link>
          </p>
        </article>

        <article className={`bg-raised p-6 ${card}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase">{d.learnerLevel}</h2>
            <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="font-display text-3xl font-black">{fill(d.level, { level: level.level })}</p>
            <span className="text-xs font-black uppercase">
              {level.xpIntoLevel} / {level.xpForNextLevel} XP
            </span>
          </div>
          <ProgressBar
            label={d.nextLevelProgress}
            value={level.xpIntoLevel}
            max={level.xpForNextLevel}
            tone="bg-primary"
          />
          <p className="mt-3 text-sm font-semibold text-muted">
            {fill(d.xpToLevel, { xp: level.xpForNextLevel - level.xpIntoLevel, level: level.level + 1 })}
          </p>
        </article>
      </section>

      {/* Learning modules */}
      <section aria-labelledby="practice-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="practice-heading" className="text-xl font-black uppercase">
            {d.practice}
          </h2>
          <span className="text-xs font-bold text-muted uppercase">{d.moreSoon}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {exercises.map(({ key, icon: Icon, tone, href }) => {
            const { title, description } = d.exercises[key];
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <Icon className="h-9 w-9" aria-hidden="true" />
                  {!href && (
                    <span className="inline-flex items-center gap-1 border-[2px] border-line bg-raised px-2 py-1 text-[10px] font-black text-fg uppercase">
                      <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                      {d.comingSoon}
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-2xl font-black uppercase">{title}</h3>
                <p className="mt-2 max-w-sm text-sm font-medium">{description}</p>
                <div className="mt-auto pt-5">
                  {href ? (
                    <span className="inline-flex items-center gap-2 text-sm font-black uppercase">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {d.open}
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  ) : (
                    <span className="text-xs font-black uppercase">{d.inDevelopment}</span>
                  )}
                </div>
              </>
            );

            return href ? (
              <Link
                key={key}
                href={href}
                className={`group flex min-h-56 flex-col p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-brutal-lg motion-reduce:transition-none ${card} ${tone}`}
              >
                {body}
              </Link>
            ) : (
              <article key={key} className={`flex min-h-56 flex-col p-6 ${card} ${tone}`}>
                {body}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
