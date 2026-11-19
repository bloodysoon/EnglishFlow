import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ChevronRight, Trophy } from "lucide-react";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { riseStyle } from "@/components/ui/rise";
import {
  unlocksByDay,
  type TimelineWord,
} from "@/features/achievements/timeline";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getTimeline } from "@/features/learning/queries";
import { reviewsOf } from "@/features/learning/statistics";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.timeline };
}

// Everything that happened, newest day first: words, reviews and the
// achievements unlocked that day.
export default async function TimelinePage() {
  const supabase = await createClient();
  const [days, { locale, t }] = await Promise.all([
    getTimeline(supabase),
    getPlatformI18n(),
  ]);
  const h = t.history;
  const a = t.achievements;
  const unlocks = unlocksByDay(days);
  const date = new Intl.DateTimeFormat(dateLocale(locale), {
    dateStyle: "full",
    timeZone: "UTC",
  });
  const number = (n: number) => n.toLocaleString(dateLocale(locale));

  // Collapsed by default so busy days stay short; the summary line shows the counts.
  const wordGroup = (
    summary: ReactNode,
    words: TimelineWord[],
    total: number,
  ) => (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-2 text-sm font-black [&::-webkit-details-marker]:hidden">
        <ChevronRight
          className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden="true"
        />
        {summary}
      </summary>
      <p className="mt-1 flex flex-wrap gap-1.5">
        {words.map((w) => (
          <Link
            key={w.id}
            href={`/learn/words/${w.id}`}
            className="border-[2px] border-line bg-raised px-2 py-0.5 text-sm font-bold hover:bg-box-2 hover:text-on-box"
          >
            {w.lemma}
          </Link>
        ))}
        {total > words.length && (
          <span className="px-1 py-0.5 text-sm font-bold text-muted">
            {fill(h.more, { n: total - words.length })}
          </span>
        )}
      </p>
    </details>
  );

  return (
    <div className="space-y-10">
      <header className="rise space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {h.title}
          <span className="text-primary">.</span>
        </h1>
        <p className="max-w-xl font-semibold text-muted">{h.lead}</p>
      </header>

      {days.length === 0 ? (
        <p className="font-semibold text-muted">{h.empty}</p>
      ) : (
        // shortcut: renders every day; page by month once histories get long.
        <ol
          className="rise ml-2 space-y-8 border-l-[3px] border-line"
          style={riseStyle(1)}
        >
          {[...days].reverse().map((day) => {
            const unlocked = unlocks.get(day.day) ?? [];
            return (
              <li key={day.day} className="relative pl-6">
                <span
                  aria-hidden="true"
                  className={`absolute top-1 -left-[11px] h-5 w-5 border-[3px] border-line ${
                    unlocked.length > 0 ? "bg-primary" : "bg-raised"
                  }`}
                />
                <h2 className="font-black uppercase">
                  <time dateTime={day.day}>
                    {date.format(new Date(`${day.day}T00:00:00Z`))}
                  </time>
                </h2>

                <div className="mt-3 space-y-3">
                  {unlocked.length > 0 && (
                    <ul
                      className="flex flex-wrap gap-2"
                      aria-label={h.unlocked}
                    >
                      {unlocked.map((u) => (
                        <li
                          key={
                            u.kind === "track" ? `${u.id}-${u.target}` : u.id
                          }
                          className="inline-flex items-center gap-1.5 border-[3px] border-line bg-chip px-2.5 py-1 text-sm font-black text-on-box shadow-brutal-sm"
                        >
                          <Trophy
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          {u.kind === "track"
                            ? `${a.tracks[u.id].name} · ${number(u.target)}`
                            : `${h.badge}: ${a.badgeList[u.id].name}`}
                        </li>
                      ))}
                    </ul>
                  )}

                  {day.active && reviewsOf(day) > 0 && (
                    <p className="text-sm font-semibold">
                      {plural(locale, reviewsOf(day), h.reviews)} ·{" "}
                      {fill(h.remembered, { n: day.remembered })}
                      <span className="ml-2 font-display text-muted">
                        +{number(day.xp)} XP
                      </span>
                    </p>
                  )}

                  {day.added > 0 &&
                    wordGroup(
                      <span>
                        {plural(locale, day.added, h.added)}
                        {day.known > 0 && (
                          <span className="font-semibold text-muted">
                            {" "}
                            · {plural(locale, day.known, h.known)}
                          </span>
                        )}
                      </span>,
                      day.words,
                      day.added,
                    )}

                  {day.practice.count > 0 &&
                    wordGroup(
                      <span>
                        {plural(locale, day.practice.count, h.practised)}
                        <span className="font-semibold text-muted">
                          {" "}
                          · {fill(h.clean, { n: day.practice.clean })}
                        </span>
                      </span>,
                      day.practice.words,
                      day.practice.words.length,
                    )}

                  {/* Highest box first: box 5 is mastered, box 1 is forgotten again. */}
                  {[5, 4, 3, 2, 1].map((box) => {
                    const moved = day.boxes[box];
                    if (!moved) return null;
                    return (
                      <Fragment key={box}>
                        {wordGroup(
                          <>
                            <span
                              className={`border-[2px] border-line px-2 py-0.5 ${leitnerBoxStyles[box]}`}
                            >
                              {fill(h.toBox, { box })}
                            </span>
                            {box === 5
                              ? plural(locale, moved.count, h.mastered)
                              : plural(locale, moved.count, t.common.words)}
                          </>,
                          moved.words,
                          moved.count,
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
