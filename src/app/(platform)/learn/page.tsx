import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Layers3, ListChecks, Plus, Sparkles } from "lucide-react";

import { LearnTour } from "@/components/learn/learn-tour";
import { StartSetButton } from "@/components/learn/start-set-button";
import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";
import { getCatalog, getLearningOverview } from "@/features/learning/queries";
import { introduceTodaysWords } from "@/features/learning/server";
import { getLearningSettings } from "@/features/settings/profile";
import { effectiveDailyGoal, getPlan } from "@/features/subscription/plans";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Learn" };

const tile =
  "group flex min-h-16 items-center gap-3 border-[3px] border-line bg-raised p-4 font-black uppercase shadow-brutal-md " +
  "transition-[transform,box-shadow,background-color] duration-150 motion-reduce:transition-none " +
  "interactive:hover:-translate-y-1 interactive:hover:bg-box-2 interactive:hover:text-on-box interactive:hover:shadow-brutal " +
  "interactive:active:translate-x-1 interactive:active:translate-y-1 interactive:active:shadow-none";

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the platform layout already redirects

  await introduceTodaysWords(supabase);
  const [overview, catalog, { settings }, plan] = await Promise.all([
    getLearningOverview(supabase),
    getCatalog(supabase, user.id),
    getLearningSettings(),
    getPlan(supabase),
  ]);

  const dailyGoal = effectiveDailyGoal(plan, settings.dailyGoal);
  const newToday = Math.min(overview.introducedToday, dailyGoal);
  const due = overview.dueToday;

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="rise text-3xl font-black tracking-tight uppercase sm:text-4xl" style={riseStyle(0)}>
          Learn<span className="text-primary">.</span>
        </h1>
        <LearnTour />
      </div>

      {/* Today: the one thing to do */}
      <section
        data-tour="today"
        aria-labelledby="today-title"
        className="rise border-[3px] border-line bg-chip p-5 text-on-box shadow-brutal sm:p-8"
        style={riseStyle(1)}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="today-title" className="text-xs font-black tracking-widest uppercase">
              Today
            </h2>
            {due > 0 ? (
              <p className="mt-1 font-display text-5xl font-black sm:text-6xl">
                {due} <span className="text-xl uppercase sm:text-2xl">{due === 1 ? "word" : "words"}</span>
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-2 font-display text-2xl font-black uppercase sm:text-3xl">
                <CheckCircle2 className="h-7 w-7 shrink-0" strokeWidth={3} aria-hidden="true" />
                {overview.total === 0 ? "Pick a set" : "All done"}
              </p>
            )}
          </div>

          {due > 0 && (
            <Link
              href="/learn/review"
              className={buttonClasses({
                size: "lg",
                className: "group w-full sm:w-auto",
              })}
            >
              Start review
              <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Link>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t-[3px] border-line pt-4 sm:flex sm:gap-8">
          <div>
            <dt className="text-xs font-black tracking-widest uppercase">New today</dt>
            <dd className="font-display text-2xl font-black">
              <Link
                href="/settings"
                className="underline-offset-4 hover:underline"
                aria-label={`${newToday} of ${dailyGoal} new words today, change daily goal`}
              >
                {newToday}/{dailyGoal}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-black tracking-widest uppercase">Waiting</dt>
            <dd className="font-display text-2xl font-black">{overview.queued}</dd>
          </div>
        </dl>
      </section>

      {/* Quick actions */}
      <nav aria-label="Your words" className="rise grid grid-cols-2 gap-3 sm:gap-4" style={riseStyle(2)}>
        <Link href="/learn/add" data-tour="add" className={tile}>
          <Plus className="h-6 w-6 shrink-0" strokeWidth={3} aria-hidden="true" />
          <span className="text-sm sm:text-base">Add word</span>
        </Link>
        <Link href="/learn/words" data-tour="words" className={tile}>
          <ListChecks className="h-6 w-6 shrink-0" strokeWidth={3} aria-hidden="true" />
          <span className="text-sm sm:text-base">My words</span>
          <span className="ml-auto border-[2px] border-line bg-surface px-2 text-sm text-fg">{overview.total}</span>
        </Link>
      </nav>

      {/* Catalog */}
      <section data-tour="sets" aria-labelledby="sets-title" className="rise" style={riseStyle(3)}>
        <h2 id="sets-title" className="mb-4 text-xl font-black uppercase">
          Word sets
        </h2>

        {catalog.length === 0 ? (
          <p className="flex items-center gap-3 border-[3px] border-dashed border-line p-5 font-black">
            <Sparkles className="h-6 w-6 shrink-0" aria-hidden="true" />
            New sets coming soon
          </p>
        ) : (
          <ul className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {catalog.map((set) => {
              const title = set.title.en ?? set.slug;
              const complete = set.wordCount > 0 && set.started >= set.wordCount;
              const progress = set.wordCount ? Math.round((set.started / set.wordCount) * 100) : 0;

              return (
                <li
                  key={set.slug}
                  className="flex flex-col border-[3px] border-line bg-surface p-4 shadow-brutal sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <Layers3 className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <h3 className="min-w-0 flex-1 truncate text-lg font-black uppercase">{title}</h3>
                    {set.level && (
                      <span className="border-[2px] border-line bg-box-2 px-2 py-0.5 text-xs font-black text-on-box">
                        {set.level}
                      </span>
                    )}
                  </div>
                  {set.description?.en && (
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-muted">{set.description.en}</p>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    <div
                      role="progressbar"
                      aria-label={`${title}: words added to your list`}
                      aria-valuemin={0}
                      aria-valuemax={set.wordCount}
                      aria-valuenow={set.started}
                      className="h-3 flex-1 overflow-hidden border-[2px] border-line bg-raised"
                    >
                      <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-black whitespace-nowrap">
                      {set.started}/{set.wordCount}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    {complete ? (
                      <p className="flex min-h-11 items-center gap-2 font-black">
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        Added
                      </p>
                    ) : (
                      <StartSetButton
                        slug={set.slug}
                        title={title}
                        label={set.started > 0 ? `+${set.wordCount - set.started} more` : "Start"}
                      />
                    )}
                    <Link
                      href={`/learn/sets/${set.slug}`}
                      aria-label={`Pick words from ${title}`}
                      className="inline-flex min-h-11 items-center gap-1 text-sm font-black uppercase hover:underline"
                    >
                      Pick
                      <ChevronRight className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
