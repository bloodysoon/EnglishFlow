import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, ListChecks, Plus } from "lucide-react";

import { ActiveFilterChips, CardFilterMenu } from "@/components/learn/card-filters";
import { LearnTour } from "@/components/learn/learn-tour";
import { WordTriage } from "@/components/learn/word-triage";
import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";
import { parseCardFilters } from "@/features/dictionary/topics";
import { getLearningOverview, getTopicsInUse, pickDictionaryCards, type TriageCard } from "@/features/learning/queries";
import { introduceTodaysWords } from "@/features/learning/server";
import { fill } from "@/features/i18n/locales";
import { getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getLearningSettings } from "@/features/settings/profile";
import { PLANS, effectiveDailyGoal, getPlan } from "@/features/subscription/plans";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.learn };
}

// Same look as the Filters and Tour buttons; icon-only and compact on phones.
const quick = buttonClasses({ size: "toolbar", variant: "secondary" });

export default async function LearnPage({ searchParams }: PageProps<"/learn">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the platform layout already redirects

  await introduceTodaysWords(supabase);
  const [overview, { settings }, plan, { locale, t }] = await Promise.all([
    getLearningOverview(supabase),
    getLearningSettings(),
    getPlan(supabase),
    getPlatformI18n(),
  ]);
  const l = t.learn;

  const dailyGoal = effectiveDailyGoal(plan, settings.dailyGoal);
  // The page still works if picking fails (e.g. the migration is not applied yet).
  const filters = parseCardFilters(await searchParams);
  const [newCards, topicsInUse] = await Promise.all([
    pickDictionaryCards(supabase, filters).catch((error: unknown): TriageCard[] => {
      logSupabaseError("[Learn] pick_dictionary_words failed", error);
      return [];
    }),
    getTopicsInUse(supabase).catch((): string[] => []),
  ]);
  const newToday = Math.min(overview.introducedToday, dailyGoal);
  const due = overview.dueToday;

  return (
    <div className="space-y-8 sm:space-y-10">
      <h1 className="sr-only">{l.title}</h1>
      <div
        className="rise relative z-20 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2"
        style={riseStyle(0)}
      >
        <nav aria-label={l.yourWords} className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/learn/add" data-tour="add" aria-label={l.addWord} className={quick}>
            <Plus className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            <span className="hidden sm:inline">{l.addWord}</span>
          </Link>
          <Link href="/learn/words" data-tour="words" aria-label={l.myWords} className={quick}>
            <ListChecks className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            <span className="hidden sm:inline">{l.myWords}</span>
            <span className="border-[2px] border-line bg-surface px-1 text-xs text-fg sm:px-1.5">{overview.total}</span>
          </Link>
          <Link href="/learn/known" data-tour="known" aria-label={l.known} className={quick}>
            <BadgeCheck className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            <span className="hidden sm:inline">{l.known}</span>
            <span className="border-[2px] border-line bg-surface px-1 text-xs text-fg sm:px-1.5">{overview.known}</span>
          </Link>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <CardFilterMenu
            filters={filters}
            topicsInUse={topicsInUse}
            t={t.triage}
            topicNames={t.topics}
            posNames={t.addWord.partsOfSpeech}
          />
          <LearnTour labels={t.tour} />
        </div>
      </div>

      {/* New word: know it or learn it */}
      <section data-tour="card" className="rise scroll-mt-24 lg:scroll-mt-8" style={riseStyle(1)}>
        <ActiveFilterChips filters={filters} t={t.triage} topicNames={t.topics} posNames={t.addWord.partsOfSpeech} />
        {/* A new filter starts a fresh pile of cards. */}
        <WordTriage
          key={`${filters.topics}|${filters.partsOfSpeech}`}
          initialCards={newCards}
          filters={filters}
          language={settings.translationLanguage}
          learnedToday={overview.introducedToday}
          limit={PLANS[plan].newWordsPerDay}
          t={t.triage}
          autoLabel={t.common.autoTranslation}
          sessionEnded={t.common.sessionEnded}
        />
      </section>

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
              {l.today}
            </h2>
            {due > 0 ? (
              <p className="mt-1 font-display text-5xl font-black sm:text-6xl">
                {due} <span className="text-xl uppercase sm:text-2xl">{plural(locale, due, l.wordUnit)}</span>
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-2 font-display text-2xl font-black uppercase sm:text-3xl">
                <CheckCircle2 className="h-7 w-7 shrink-0" strokeWidth={3} aria-hidden="true" />
                {overview.total === 0 ? l.pickWords : l.allDone}
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
              {l.startReview}
              <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Link>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t-[3px] border-line pt-4 sm:flex sm:gap-8">
          <div>
            <dt className="text-xs font-black tracking-widest uppercase">{l.newToday}</dt>
            <dd className="font-display text-2xl font-black">
              <Link
                href="/settings"
                className="underline-offset-4 hover:underline"
                aria-label={fill(l.newTodayAria, { done: newToday, goal: dailyGoal })}
              >
                {newToday}/{dailyGoal}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-black tracking-widest uppercase">{l.waiting}</dt>
            <dd className="font-display text-2xl font-black">{overview.queued}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
