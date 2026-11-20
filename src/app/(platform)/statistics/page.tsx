import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Crown,
  Flame,
  Gauge,
  GraduationCap,
  Layers,
  Shapes,
  Tags,
  Hourglass,
  Repeat,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { HourChart } from "@/components/statistics/hour-chart";
import { BarChart } from "@/components/statistics/bar-chart";
import { ChartTip, tipAlign, tipMark } from "@/components/statistics/chart-tip";
import { StackedBar, type BarPart } from "@/components/statistics/stacked-bar";
import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";
import { fill, type Locale } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import {
  getLearningOverview,
  getStatistics,
  getWordsByLevel,
  getWordsByTopic,
  getWordsByType,
} from "@/features/learning/queries";
import {
  accuracyOf,
  accuracyTrend,
  activitySummary,
  daysBetween,
  heatmapWeeks,
  intensity,
  lastNDays,
  longestStreak,
  peakIndex,
  PERFECT_DAY_MIN,
  reviewsOf,
  weekdayTotals,
} from "@/features/learning/statistics";
import { createClient } from "@/lib/supabase/server";

const card = "border-[3px] border-line shadow-brutal";

// Heatmap steps: one hue, light → dark (0 = nothing that day).
const heatTone = ["bg-canvas", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.statistics };
}

const formatDay = (locale: Locale, day: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(dateLocale(locale), {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));

const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article className={`flex flex-col p-5 ${card} ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black tracking-wide uppercase">{label}</h3>
        {icon}
      </div>
      <p className="font-display mt-4 text-3xl font-black tracking-tight break-words sm:text-4xl">{value}</p>
      {hint && <p className="mt-2 text-sm font-semibold">{hint}</p>}
    </article>
  );
}

export default async function StatisticsPage() {
  const supabase = await createClient();
  const [stats, overview, { locale, t }, wordsByLevel, wordsByType, wordsByTopic] = await Promise.all([
    getStatistics(supabase),
    getLearningOverview(supabase),
    getPlatformI18n(),
    getWordsByLevel(supabase),
    getWordsByType(supabase),
    getWordsByTopic(supabase),
  ]);
  const s = t.statistics;
  const { today, days } = stats;
  const number = (n: number) => n.toLocaleString(dateLocale(locale));

  // Words by level and by type share one look: known, mastered, learning.
  const wordParts = (w: { known: number; mastered: number; learning: number }): BarPart[] => [
    { tone: "bg-box-4", label: s.knownWords, value: w.known },
    { tone: "bg-box-5", label: s.masteredWords, value: w.mastered },
    { tone: "bg-box-2", label: s.learningWords, value: w.learning },
  ];
  const describe = (parts: BarPart[]) => parts.map((p) => `${p.label} ${number(p.value)}`).join(", ");
  const legend = (
    <ul className="mt-3 mb-5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-black uppercase">
      {wordParts({ known: 0, mastered: 0, learning: 0 }).map((p) => (
        <li key={p.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-3 w-3 border-[2px] border-line ${p.tone}`} />
          {p.label}
        </li>
      ))}
    </ul>
  );
  const posNames = t.addWord.partsOfSpeech as Record<string, string>;
  const typeName = (type: string) => posNames[type] ?? type;
  const topicNames = t.topics as Record<string, string>;


  const header = (
    <header className="rise space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0" style={riseStyle(0)}>
      <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
        {s.title}
        <span className="text-primary">.</span>
      </h1>
      <p className="max-w-xl font-semibold text-muted">{s.lead}</p>
    </header>
  );

  const summary = activitySummary(days);
  if (summary.reviews === 0) {
    return (
      <div className="space-y-8">
        {header}
        <div className={`max-w-xl space-y-5 bg-raised p-6 ${card}`}>
          <p className="font-semibold">{s.empty}</p>
          <Link href="/learn" className={buttonClasses({})}>
            {s.startLearning}
          </Link>
        </div>
      </div>
    );
  }

  const shortDate = (day: string) => formatDay(locale, day, { day: "numeric", month: "short" });
  const fullDate = (day: string) => formatDay(locale, day, { day: "numeric", month: "short", year: "numeric" });

  const longest = longestStreak(days.map((d) => d.day));
  const learningDays = summary.firstDay ? daysBetween(summary.firstDay, today) + 1 : 0;

  // Last 30 days, stacked: remembered at the bottom, forgot on top.
  const recent = lastNDays(days, today, 30);
  const recentMax = Math.max(1, ...recent.map(reviewsOf));
  const trend = accuracyTrend(days, today, 30);
  const trendPoints =
    trend.current !== null && trend.previous !== null ? Math.round((trend.current - trend.previous) * 100) : null;

  // Heatmap
  const weeks = heatmapWeeks(days, today);
  const heatMax = Math.max(0, ...weeks.flat().map((cell) => cell?.reviews ?? 0));
  const monthOf = (week: (typeof weeks)[number]) => week[0]?.day.slice(0, 7);

  // Weekdays, Monday first (2026-11-16 is a Monday).
  const weekdays = weekdayTotals(days);
  const weekdayPeak = peakIndex(weekdays);
  const weekdayName = (i: number, weekday: "short" | "long") => formatDay(locale, `2026-11-${16 + i}`, { weekday });

  return (
    <div className="space-y-10">
      {header}

      {/* Records */}
      <section aria-labelledby="records-heading" className="rise" style={riseStyle(1)}>
        <h2 id="records-heading" className="mb-4 text-xl font-black uppercase">
          {s.records}
        </h2>
        {/* A card left alone on the last row of three spans the row. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:[&>*:last-child:nth-child(3n+1)]:col-span-3">
          <StatCard
            label={s.currentStreak}
            value={plural(locale, overview.streak, t.dashboard.days)}
            icon={<Flame className="h-6 w-6" aria-hidden="true" />}
            tone="bg-box-2 text-on-box"
          />
          <StatCard
            label={s.longestStreak}
            value={longest ? plural(locale, longest.length, t.dashboard.days) : s.notYet}
            hint={
              longest &&
              (longest.length > 1
                ? fill(s.range, {
                    start: shortDate(longest.start),
                    end: fullDate(longest.end),
                  })
                : fullDate(longest.end))
            }
            icon={<Crown className="h-6 w-6" aria-hidden="true" />}
            tone="bg-box-5 text-on-box-5"
          />
          <StatCard
            label={s.reviews}
            value={summary.reviews.toLocaleString(dateLocale(locale))}
            hint={fill(s.reviewsSplit, {
              remembered: summary.remembered,
              forgot: summary.forgot,
            })}
            icon={<Repeat className="h-6 w-6" aria-hidden="true" />}
            tone="bg-raised text-fg"
          />
          <StatCard
            label={s.accuracy}
            value={percent(summary.accuracy)}
            hint={s.accuracyHint}
            icon={<Target className="h-6 w-6" aria-hidden="true" />}
            tone="bg-box-3 text-on-box-3"
          />
          <StatCard
            label={s.bestDay}
            value={summary.bestDay ? plural(locale, reviewsOf(summary.bestDay), s.reviewsCount) : s.notYet}
            hint={summary.bestDay && fullDate(summary.bestDay.day)}
            icon={<Sparkles className="h-6 w-6" aria-hidden="true" />}
            tone="bg-box-4 text-on-box"
          />
          <StatCard
            label={s.learningFor}
            value={plural(locale, learningDays, t.dashboard.days)}
            hint={
              summary.firstDay &&
              `${fill(s.since, { date: fullDate(summary.firstDay) })} · ${plural(locale, summary.activeDays, s.activeDays)}`
            }
            icon={<CalendarDays className="h-6 w-6" aria-hidden="true" />}
            tone="bg-raised text-fg"
          />
          <StatCard
            label={s.perfectDays}
            value={summary.perfectDays}
            hint={fill(s.perfectDaysHint, { n: PERFECT_DAY_MIN })}
            icon={<CalendarCheck className="h-6 w-6" aria-hidden="true" />}
            tone="bg-raised text-fg"
          />
          <StatCard
            label={s.perActiveDay}
            value={summary.avgReviewsPerActiveDay}
            hint={s.perActiveDayHint}
            icon={<Gauge className="h-6 w-6" aria-hidden="true" />}
            tone="bg-raised text-fg"
          />
          <StatCard
            label={s.toMaster}
            value={stats.mastery.avgDays === null ? "—" : stats.mastery.avgDays.toLocaleString(dateLocale(locale))}
            hint={stats.mastery.avgDays === null ? s.toMasterNone : plural(locale, stats.mastery.count, s.toMasterHint)}
            icon={<Hourglass className="h-6 w-6" aria-hidden="true" />}
            tone="bg-box-1 text-on-box"
          />
          <StatCard
            label={s.xp}
            value={overview.xpTotal.toLocaleString(dateLocale(locale))}
            hint={fill(t.dashboard.levelLearner, {
              level: overview.level.level,
            })}
            icon={<Zap className="h-6 w-6" aria-hidden="true" />}
            tone="bg-raised text-fg"
          />
        </div>
      </section>

      {/* Activity heatmap */}
      <section aria-labelledby="activity-heading" className={`rise bg-raised p-5 sm:p-6 ${card}`} style={riseStyle(2)}>
        <h2 id="activity-heading" className="text-xl font-black uppercase">
          {s.activity}
        </h2>
        <p className="mt-1 text-sm font-semibold text-muted">
          {s.activityLead} {plural(locale, summary.activeDays, s.activeDays)}.
        </p>
        {/* rtl: on narrow screens the scroller starts at today, on the right. */}
        <div dir="rtl" className="mt-1 overflow-x-auto pt-10 pb-2">
          <div dir="ltr" className="inline-flex flex-col gap-1" aria-hidden="true">
            <div className="flex gap-[3px]">
              {weeks.map((week, w) => (
                <span
                  key={w}
                  className="w-3 shrink-0 overflow-visible text-[10px] font-bold whitespace-nowrap text-muted"
                >
                  {w > 0 && monthOf(week) !== monthOf(weeks[w - 1]) && week[0]
                    ? formatDay(locale, week[0].day, { month: "short" })
                    : ""}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, w) => (
                <div key={w} className="flex flex-col gap-[3px]">
                  {week.map((cell, d) =>
                    cell ? (
                      <span
                        key={d}
                        tabIndex={-1}
                        className={`h-3 w-3 border border-line/40 ${heatTone[intensity(cell.reviews, heatMax)]} ${tipMark}`}
                      >
                        <ChartTip
                          text={`${fullDate(cell.day)} · ${plural(locale, cell.reviews, s.reviewsCount)}`}
                          align={tipAlign(w, weeks.length)}
                        />
                      </span>
                    ) : (
                      <span key={d} className="h-3 w-3" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1 text-xs font-bold text-muted" aria-hidden="true">
          {s.less}
          {heatTone.map((tone) => (
            <span key={tone} className={`h-3 w-3 border border-line/40 ${tone}`} />
          ))}
          {s.more}
        </div>
      </section>

      {/* Last 30 days */}
      <section aria-labelledby="recent-heading" className={`rise bg-raised p-5 sm:p-6 ${card}`} style={riseStyle(3)}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 id="recent-heading" className="text-xl font-black uppercase">
            {s.last30}
          </h2>
          <ul className="flex gap-4 text-xs font-bold">
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 border-[2px] border-line bg-box-4" aria-hidden="true" />
              {s.remembered}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 border-[2px] border-line bg-box-1" aria-hidden="true" />
              {s.forgot}
            </li>
          </ul>
        </div>
        {trend.current !== null && (
          <p className="mt-1 text-sm font-semibold">
            <span className="font-black">{fill(s.accuracy30, { pct: Math.round(trend.current * 100) })}</span>
            {trendPoints !== null && (
              <span className="text-muted">
                {" · "}
                {trendPoints > 0
                  ? fill(s.trendUp, { pts: trendPoints })
                  : trendPoints < 0
                    ? fill(s.trendDown, { pts: -trendPoints })
                    : s.trendSame}
              </span>
            )}
          </p>
        )}
        <ol className="mt-5 flex h-44 items-end gap-[2px] border-b-[3px] border-line">
          {recent.map((d, i) => {
            const title = `${fullDate(d.day)} · ${s.remembered}: ${d.remembered} · ${s.forgot}: ${d.forgot}`;
            return (
              <li
                key={d.day}
                tabIndex={-1}
                className={`flex h-full min-w-0 flex-1 flex-col justify-end gap-[2px] ${tipMark}`}
              >
                <span className="sr-only">{title}</span>
                <ChartTip text={title} align={tipAlign(i, recent.length)} />
                {d.forgot > 0 && (
                  <span
                    aria-hidden="true"
                    className="w-full rounded-t-[4px] border-[2px] border-b-0 border-line bg-box-1"
                    style={{ height: `${(d.forgot / recentMax) * 100}%` }}
                  />
                )}
                {d.remembered > 0 && (
                  <span
                    aria-hidden="true"
                    className={`w-full border-[2px] border-b-0 border-line bg-box-4 ${d.forgot === 0 ? "rounded-t-[4px]" : ""}`}
                    style={{ height: `${(d.remembered / recentMax) * 100}%` }}
                  />
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-1 flex justify-between text-[10px] font-bold text-muted sm:text-xs" aria-hidden="true">
          <span>{shortDate(recent[0].day)}</span>
          <span>{shortDate(recent[recent.length - 1].day)}</span>
        </div>
      </section>

      {/* When */}
      <section aria-labelledby="when-heading" className="rise" style={riseStyle(4)}>
        <h2 id="when-heading" className="mb-4 text-xl font-black uppercase">
          {s.when}
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <article className={`bg-raised p-5 sm:p-6 ${card}`}>
            <h3 className="mb-4 text-sm font-black uppercase">{s.byWeekday}</h3>
            <BarChart
              values={weekdays}
              labels={weekdays.map((_, i) => weekdayName(i, "short"))}
              titles={weekdays.map((n, i) => `${weekdayName(i, "long")} · ${plural(locale, n, s.reviewsCount)}`)}
              peak={weekdayPeak}
            />
            {weekdayPeak >= 0 && (
              <p className="mt-3 text-sm font-black">
                {fill(s.peakWeekday, { day: weekdayName(weekdayPeak, "long") })}
              </p>
            )}
          </article>
          <article className={`bg-raised p-5 sm:p-6 ${card}`}>
            <h3 className="mb-4 text-sm font-black uppercase">{s.byHour}</h3>
            <HourChart hoursUtc={stats.hoursUtc} locale={locale} reviewsCount={s.reviewsCount} peakLabel={s.peakHour} />
          </article>
        </div>
      </section>

      {/* My words per level, out of the dictionary */}
      {wordsByLevel.some((l) => l.known + l.mastered + l.learning > 0) && (
        <section aria-labelledby="words-level-heading" className={`rise bg-raised p-5 sm:p-6 ${card}`} style={riseStyle(5)}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="words-level-heading" className="text-xl font-black uppercase">
              {s.wordsByLevel}
            </h2>
            <Layers className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm font-semibold text-muted">{s.wordsByLevelLead}</p>
          {legend}
          <ul className="space-y-4">
            {wordsByLevel.map((l) => {
              const parts = wordParts(l);
              const mine = l.known + l.mastered + l.learning;
              const heading = fill(s.ofDictionary, { n: number(mine), total: number(l.dictionary) });
              return (
                <li key={l.level} className="grid grid-cols-[2.75rem_1fr] items-center gap-3">
                  <span className="border-[2px] border-line bg-chip px-1.5 py-0.5 text-center text-xs font-black text-on-box">
                    {l.level}
                  </span>
                  <StackedBar
                    parts={parts}
                    // Own words can push a level past the dictionary's count.
                    max={Math.max(l.dictionary, mine)}
                    heading={heading}
                    label={`${l.level}: ${describe(parts)} · ${heading}`}
                    format={number}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* My words per part of speech, out of the dictionary */}
      {wordsByType.length > 0 && (
        <section aria-labelledby="words-type-heading" className={`rise bg-raised p-5 sm:p-6 ${card}`} style={riseStyle(5)}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="words-type-heading" className="text-xl font-black uppercase">
              {s.wordsByType}
            </h2>
            <Shapes className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm font-semibold text-muted">{s.wordsByTypeLead}</p>
          {legend}
          <ul className="space-y-4">
            {wordsByType.map((w) => {
              const parts = wordParts(w);
              const mine = w.known + w.mastered + w.learning;
              const name = typeName(w.type);
              const heading = w.dictionary > 0 ? fill(s.ofDictionary, { n: number(mine), total: number(w.dictionary) }) : number(mine);
              return (
                <li key={w.type} className="grid grid-cols-[minmax(0,7.5rem)_1fr] items-center gap-3 sm:grid-cols-[9rem_1fr]">
                  <span className="truncate border-[2px] border-line bg-chip px-1.5 py-0.5 text-center text-xs font-black text-on-box uppercase">
                    {name}
                  </span>
                  <StackedBar
                    parts={parts}
                    // Out of the dictionary's words of this type, as the box says.
                    max={Math.max(w.dictionary, mine)}
                    heading={heading}
                    label={`${name}: ${describe(parts)} · ${heading}`}
                    format={number}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* My words per topic, out of the dictionary */}
      {wordsByTopic.length > 0 && (
        <section aria-labelledby="words-topic-heading" className={`rise bg-raised p-5 sm:p-6 ${card}`} style={riseStyle(5)}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="words-topic-heading" className="text-xl font-black uppercase">
              {s.wordsByTopic}
            </h2>
            <Tags className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm font-semibold text-muted">{s.wordsByTopicLead}</p>
          {legend}
          <ul className="space-y-4">
            {wordsByTopic.map((w) => {
              const parts = wordParts(w);
              const mine = w.known + w.mastered + w.learning;
              const name = topicNames[w.topic] ?? w.topic;
              const heading = fill(s.ofDictionary, { n: number(mine), total: number(w.dictionary) });
              return (
                <li key={w.topic} className="grid grid-cols-[minmax(0,7.5rem)_1fr] items-center gap-3 sm:grid-cols-[9rem_1fr]">
                  <span className="truncate border-[2px] border-line bg-chip px-1.5 py-0.5 text-center text-xs font-black text-on-box uppercase">
                    {name}
                  </span>
                  <StackedBar
                    parts={parts}
                    // Out of the dictionary's words of this topic, as the box says.
                    max={Math.max(w.dictionary, mine)}
                    heading={heading}
                    label={`${name}: ${describe(parts)} · ${heading}`}
                    format={number}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* CEFR levels */}
      {stats.levels.length > 0 && (
        <section aria-labelledby="levels-heading" className={`rise bg-raised p-5 sm:p-6 ${card}`} style={riseStyle(5)}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="levels-heading" className="text-xl font-black uppercase">
              {s.levels}
            </h2>
            <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-1 mb-5 text-sm font-semibold text-muted">{s.levelsLead}</p>
          <ul className="space-y-3">
            {stats.levels.map((level) => {
              const accuracy = accuracyOf(level) ?? 0;
              return (
                <li key={level.level} className="grid grid-cols-[2.75rem_1fr] items-center gap-3">
                  <span className="border-[2px] border-line bg-chip px-1.5 py-0.5 text-center text-xs font-black text-on-box">
                    {level.level}
                  </span>
                  {/* The review count shows on hover, keyboard focus or tap. */}
                  <span
                    tabIndex={0}
                    role="img"
                    aria-label={`${level.level}: ${percent(accuracy)} · ${plural(locale, reviewsOf(level), s.reviewsCount)}`}
                    className="group relative block cursor-default focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="block h-5 border-[2px] border-line bg-canvas">
                      <span className="block h-full bg-box-4" style={{ width: `${accuracy * 100}%` }} />
                    </span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden border-[2px] border-line bg-raised px-2 py-1 text-xs font-black whitespace-nowrap text-fg shadow-brutal-sm group-hover:block group-focus:block"
                    >
                      {plural(locale, reviewsOf(level), s.reviewsCount)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Link
        href="/learn/hard-words"
        className="group inline-flex min-h-11 items-center gap-2 text-sm font-black uppercase underline decoration-[3px] underline-offset-4 hover:decoration-mark"
      >
        {s.hardWordsLink}
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
