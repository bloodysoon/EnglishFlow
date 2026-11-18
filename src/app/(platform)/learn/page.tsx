import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { BadgeCheck, ListChecks, Plus, RotateCcw } from "lucide-react";

import { ActiveFilterChips, CardFilterMenu } from "@/components/learn/card-filters";
import { LearnPanels, LearnPanelsProvider, PanelChips } from "@/components/learn/learn-panels";
import { LEARN_HIDDEN_COOKIE, parseHiddenPanels } from "@/features/learning/learn-panels";
import { LearnTour } from "@/components/learn/learn-tour";
import { WordTriage } from "@/components/learn/word-triage";
import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";
import { parseCardFilters } from "@/features/dictionary/topics";
import { fill } from "@/features/i18n/locales";
import { plural } from "@/features/i18n/plural";
import { getLearningOverview, getTopicsInUse, pickDictionaryCards, type TriageCard } from "@/features/learning/queries";
import { introduceTodaysWords } from "@/features/learning/server";
import { getPlatformI18n } from "@/features/i18n/platform";
import { getLearningSettings } from "@/features/settings/profile";
import { PLANS, effectiveDailyGoal, getPlan } from "@/features/subscription/plans";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.learn };
}

// Same look as the Tour button; icon-only and compact on phones.
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

  // The page still works if picking fails (e.g. the migration is not applied yet).
  const filters = parseCardFilters(await searchParams);
  const [newCards, topicsInUse] = await Promise.all([
    pickDictionaryCards(supabase, filters).catch((error: unknown): TriageCard[] => {
      logSupabaseError("[Learn] pick_dictionary_words failed", error);
      return [];
    }),
    getTopicsInUse(supabase).catch((): string[] => []),
  ]);
  const due = overview.dueToday;
  const dailyGoal = effectiveDailyGoal(plan, settings.dailyGoal);
  const newToday = Math.min(overview.introducedToday, dailyGoal);
  const today = { done: newToday, goal: dailyGoal, addedText: plural(locale, newToday, l.addedToday) };
  const panelLabels = { learn: l, triage: t.triage };
  const hiddenPanels = parseHiddenPanels((await cookies()).get(LEARN_HIDDEN_COOKIE)?.value);

  return (
    <LearnPanelsProvider initialHidden={hiddenPanels}>
      <div className="space-y-6 sm:space-y-8">
        {/* Page header: title, then the tour and the one primary action. */}
        <header className="rise flex flex-wrap items-center justify-between gap-3" style={riseStyle(0)}>
          <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
            {l.title}
            <span className="text-primary">.</span>
          </h1>
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <PanelChips today={today} labels={panelLabels} />
            <LearnTour labels={t.tour} />
            {due > 0 && (
              <Link
                href="/learn/review"
                data-tour="today"
                aria-label={fill(l.review, { n: due })}
                className={buttonClasses({ size: "toolbar", className: "group" })}
              >
                <RotateCcw
                  className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180 motion-reduce:transition-none"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">{fill(l.review, { n: due })}</span>
                {/* Phones: icon and number only. */}
                <span className="border-[2px] border-line bg-surface px-1 text-xs text-fg sm:hidden">{due}</span>
              </Link>
            )}
          </div>
        </header>

        {/* Today's learning and the current session; each can fold into a header chip. */}
        <div className="rise" style={riseStyle(1)}>
          <LearnPanels today={today} labels={panelLabels} />
        </div>

        {/* Toolbar: your word lists, then a rule before the cards. */}
        <nav
          aria-label={l.yourWords}
          className="rise flex flex-wrap items-center gap-1.5 border-b-[2px] border-line pb-6 sm:gap-2"
          style={riseStyle(2)}
        >
          <Link href="/learn/add" data-tour="add" aria-label={l.addWord} className={quick}>
            <Plus className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            <span className="hidden sm:inline">{l.addWord}</span>
          </Link>
          <Link href="/learn/words" data-tour="words" aria-label={l.myWords} className={quick}>
            <ListChecks className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            <span className="hidden sm:inline">{l.myWords}</span>
          </Link>
          <Link href="/learn/known" data-tour="known" aria-label={l.known} className={quick}>
            <BadgeCheck className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            <span className="hidden sm:inline">{l.known}</span>
          </Link>
        </nav>

        {/* Discover words: know it or learn it, with the filters for this pile. */}
        <section aria-labelledby="discover-title" className="rise" style={riseStyle(3)}>
          {/* Above the card so the filter panel opens over it. */}
          <div className="relative z-20 flex items-center justify-between gap-3">
            <h2 id="discover-title" className="text-sm font-black tracking-widest uppercase">
              {t.triage.title}
            </h2>
            <CardFilterMenu
              filters={filters}
              topicsInUse={topicsInUse}
              t={t.triage}
              topicNames={t.topics}
              posNames={t.addWord.partsOfSpeech}
            />
          </div>
          <ActiveFilterChips filters={filters} t={t.triage} topicNames={t.topics} posNames={t.addWord.partsOfSpeech} />
          <div data-tour="card" className="mt-4 scroll-mt-24 lg:scroll-mt-8">
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
          </div>
        </section>
      </div>
    </LearnPanelsProvider>
  );
}
