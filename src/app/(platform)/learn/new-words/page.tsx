import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ActiveFilterChips, CardFilterMenu } from "@/components/learn/card-filters";
import { LearnPanels, LearnPanelsProvider, PanelChips } from "@/components/learn/learn-panels";
import { LEARN_HIDDEN_COOKIE, parseHiddenPanels } from "@/features/learning/learn-panels";
import { LearnTour } from "@/components/learn/learn-tour";
import { WordTriage } from "@/components/learn/word-triage";
import { riseStyle } from "@/components/ui/rise";
import { parseCardFilters } from "@/features/dictionary/topics";
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

export default async function LearnPage({ searchParams }: PageProps<"/learn/new-words">) {
  const supabase = await createClient();
  // introduce_new_words finds the user itself, so it does not wait for getUser.
  const [
    {
      data: { user },
    },
  ] = await Promise.all([supabase.auth.getUser(), introduceTodaysWords(supabase)]);
  if (!user) return null; // the platform layout already redirects

  const filters = parseCardFilters(await searchParams);
  // Everything after today's introduction is independent, so it runs together.
  const [overview, { settings }, plan, { locale, t }, newCards, topicsInUse] = await Promise.all([
    getLearningOverview(supabase),
    getLearningSettings(),
    getPlan(supabase),
    getPlatformI18n(),
    // The page still works if picking fails (e.g. the migration is not applied yet).
    pickDictionaryCards(supabase, filters).catch((error: unknown): TriageCard[] => {
      logSupabaseError("[Learn] pick_dictionary_words failed", error);
      return [];
    }),
    getTopicsInUse(supabase).catch((): string[] => []),
  ]);
  const l = t.learn;
  const dailyGoal = effectiveDailyGoal(plan, settings.dailyGoal);
  const newToday = Math.min(overview.introducedToday, dailyGoal);
  const today = { done: newToday, goal: dailyGoal, addedText: plural(locale, newToday, l.addedToday) };
  const panelLabels = { learn: l, triage: t.triage };
  const hiddenPanels = parseHiddenPanels((await cookies()).get(LEARN_HIDDEN_COOKIE)?.value);

  return (
    <LearnPanelsProvider initialHidden={hiddenPanels}>
      <div className="space-y-6 sm:space-y-8">
        {/* Page header: title with filters, then the folded panels and the tour.
            relative z-20: the filter panel opens from the header's left edge, over the panels below. */}
        <header className="rise relative z-20 flex flex-wrap items-center justify-between gap-x-1.5 gap-y-3 sm:gap-3" style={riseStyle(0)}>
          <div className="flex items-center gap-1 sm:gap-3">
            <h1 className="text-2xl font-black tracking-tight uppercase sm:text-4xl">
              {l.title}
              <span className="text-primary">.</span>
            </h1>
            <CardFilterMenu
              filters={filters}
              topicsInUse={topicsInUse}
              t={t.triage}
              topicNames={t.topics}
              posNames={t.addWord.partsOfSpeech}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            <PanelChips today={today} labels={panelLabels} />
            <LearnTour labels={t.tour} />
          </div>
        </header>

        {/* Today's learning and the current session; each can fold into a header chip. */}
        <div className="rise" style={riseStyle(1)}>
          <LearnPanels today={today} labels={panelLabels} />
        </div>

        {/* Discover words: active filters, then the card. */}
        <section aria-labelledby="discover-title" className="rise" style={riseStyle(2)}>
          <h2 id="discover-title" className="sr-only">
            {t.triage.title}
          </h2>
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
