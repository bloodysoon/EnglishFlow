import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ChevronRight, Repeat, Swords, Trophy, UserPlus } from "lucide-react";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { DayDetails } from "@/components/timeline/day-details";
import { chipClasses } from "@/components/ui/chip";
import { riseStyle } from "@/components/ui/rise";
import {
  dayUpTo,
  unlocksByDay,
  type TimelineWord,
} from "@/features/achievements/timeline";
import { duelsByDay } from "@/features/duels/duels";
import { getDuels } from "@/features/duels/queries";
import { friendsByDay } from "@/features/friends/friends";
import { getFriendEvents } from "@/features/friends/queries";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getTimeline } from "@/features/learning/queries";
import { reviewsOf } from "@/features/learning/statistics";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.timeline };
}

// Everything that happened, newest day first: words, reviews and the
// achievements unlocked that day.
export default async function TimelinePage() {
  const supabase = await createClient();
  const [learning, friends, duels, { locale, t }] = await Promise.all([
    getTimeline(supabase),
    // Friends are extra here: if they fail to load, the timeline still shows.
    getFriendEvents(supabase).catch((error) => {
      logSupabaseError("[Timeline] Loading friends failed", error);
      return [];
    }),
    // shortcut: duels_list returns the last 50 duels; add a paged query once histories grow.
    getDuels(supabase).catch((error) => {
      logSupabaseError("[Timeline] Loading duels failed", error);
      return [];
    }),
    getPlatformI18n(),
  ]);
  const newFriends = friendsByDay(friends);
  const duelDays = duelsByDay(duels);
  // A day with only a new friend or a duel gets an empty learning day.
  const days = [
    ...learning,
    ...[...new Set([...newFriends.keys(), ...duelDays.keys()])]
      .filter((d) => !learning.some((l) => l.day === d))
      .map((d) => dayUpTo(d, [])),
  ].sort((a, b) => (a.day < b.day ? -1 : 1));
  const h = t.history;
  const a = t.achievements;
  const unlocks = unlocksByDay(days);
  const date = new Intl.DateTimeFormat(dateLocale(locale), {
    dateStyle: "full",
    timeZone: "UTC",
  });
  const number = (n: number) => n.toLocaleString(dateLocale(locale));
  const w = t.wordPage;
  const dayLabels = {
    added: w.added,
    known: w.known,
    remembered: w.remembered,
    forgot: w.forgot,
    mastered: w.mastered,
    practice: w.practice,
    boxMove: w.boxMove,
    clean: t.sentenceCheck.clean,
    mistakes: t.sentenceCheck.mistakes,
    empty: h.dayEmpty,
    loading: t.common.loading,
    unexpected: t.common.unexpected,
  };

  // Collapsed by default so busy days stay short; the summary line shows the counts.
  const wordGroup = (
    summary: ReactNode,
    words: TimelineWord[],
    total: number,
    tone: string,
  ) => (
    <details className="group">
      <summary
        className={`${chipClasses(tone, true)} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
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
      <header
        className="rise space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0"
        style={riseStyle(0)}
      >
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
            const friendsToday = newFriends.get(day.day) ?? [];
            const duelsToday = duelDays.get(day.day) ?? [];
            return (
              <li key={day.day} className="relative pl-6">
                <span
                  aria-hidden="true"
                  className={`absolute top-1 -left-[11px] h-5 w-5 border-[3px] border-line ${
                    unlocked.length > 0 ? "bg-primary" : "bg-raised"
                  }`}
                />
                <DayDetails
                  day={day.day}
                  title={date.format(new Date(`${day.day}T00:00:00Z`))}
                  locale={locale}
                  timeLocale={dateLocale(locale)}
                  labels={dayLabels}
                  events={[
                    ...friendsToday.map((f) => ({
                      at: f.at,
                      kind: "friend" as const,
                      label: `${h.newFriend}: @${f.username}`,
                    })),
                    ...duelsToday.map((d) => ({
                      at: d.created_at,
                      kind: "duel" as const,
                      href: `/duels/${d.id}`,
                      label: `${d.result ? t.duels.results[d.result] : t.duels.results.draw} · ${fill(t.duels.vs, { name: d.them_username ?? "?" })} ${d.my_score}:${d.their_score}`,
                    })),
                  ]}
                >
                  {/* The day's summary; hidden while the day is unfolded, which lists it all. */}
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
                            className={chipClasses("bg-chip text-on-box")}
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

                    {friendsToday.length > 0 && (
                      <ul
                        className="flex flex-wrap gap-2"
                        aria-label={h.newFriend}
                      >
                        {friendsToday.map((f, i) => (
                          <li
                            key={`${f.username}-${i}`}
                            className={chipClasses("bg-box-3 text-on-box-3")}
                          >
                            <UserPlus
                              className="h-4 w-4 shrink-0"
                              aria-hidden="true"
                            />
                            {h.newFriend}: @{f.username}
                          </li>
                        ))}
                      </ul>
                    )}

                    {duelsToday.length > 0 && (
                      <ul
                        className="flex flex-wrap gap-2"
                        aria-label={t.duels.title}
                      >
                        {duelsToday.map((d) => (
                          <li key={d.id}>
                            <Link
                              href={`/duels/${d.id}`}
                              className={chipClasses(
                                "bg-box-4 text-on-box",
                                true,
                              )}
                            >
                              <Swords
                                className="h-4 w-4 shrink-0"
                                aria-hidden="true"
                              />
                              {d.result
                                ? t.duels.results[d.result]
                                : t.duels.results.draw}{" "}
                              ·{" "}
                              {fill(t.duels.vs, {
                                name: d.them_username ?? "?",
                              })}
                              <span className="tabular-nums">
                                {d.my_score}:{d.their_score}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}

                    {day.active && reviewsOf(day) > 0 && (
                      <p>
                        <span
                          className={chipClasses("bg-primary text-on-primary")}
                        >
                          <Repeat
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          {plural(locale, reviewsOf(day), h.reviews)} ·{" "}
                          {fill(h.remembered, { n: day.remembered })}
                          <span className="font-display opacity-80">
                            +{number(day.xp)} XP
                          </span>
                        </span>
                      </p>
                    )}

                    {day.added > 0 &&
                      wordGroup(
                        <span>
                          {plural(locale, day.added, h.added)}
                          {day.known > 0 && (
                            <span className="font-semibold opacity-80">
                              {" "}
                              · {plural(locale, day.known, h.known)}
                            </span>
                          )}
                        </span>,
                        day.words,
                        day.added,
                        "bg-box-2 text-on-box",
                      )}

                    {day.practice.count > 0 &&
                      wordGroup(
                        <span>
                          {plural(locale, day.practice.count, h.practised)}
                          <span className="font-semibold opacity-80">
                            {" "}
                            · {fill(h.clean, { n: day.practice.clean })}
                          </span>
                        </span>,
                        day.practice.words,
                        day.practice.words.length,
                        "bg-box-3 text-on-box-3",
                      )}

                    {/* Highest box first: box 5 is mastered, box 1 is forgotten again. */}
                    {[5, 4, 3, 2, 1].map((box) => {
                      const moved = day.boxes[box];
                      if (!moved) return null;
                      return (
                        <Fragment key={box}>
                          {wordGroup(
                            <>
                              {fill(h.toBox, { box })} ·{" "}
                              {box === 5
                                ? plural(locale, moved.count, h.mastered)
                                : plural(locale, moved.count, t.common.words)}
                            </>,
                            moved.words,
                            moved.count,
                            leitnerBoxStyles[box],
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                </DayDetails>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
