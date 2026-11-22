import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { LearnPanelsProvider } from "@/components/learn/learn-panels";
import { ReviewSession } from "@/components/learn/review-session";
import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";
import { getLearningOverview, getReviewQueue } from "@/features/learning/queries";
import { LEARN_HIDDEN_COOKIE, parseHiddenPanels } from "@/features/learning/learn-panels";
import { introduceTodaysWords } from "@/features/learning/server";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { getLearningSettings } from "@/features/settings/profile";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.review };
}

export default async function ReviewPage() {
  const supabase = await createClient();
  // introduce_new_words finds the user itself, so it does not wait for getUser.
  const [
    {
      data: { user },
    },
  ] = await Promise.all([supabase.auth.getUser(), introduceTodaysWords(supabase)]);
  if (!user) return null; // the platform layout already redirects

  // The queue needs only the overview's date, so it starts as soon as that
  // arrives instead of waiting for the slower settings.
  const overviewLoad = getLearningOverview(supabase);
  const [{ settings }, overview, { locale, t }, cards] = await Promise.all([
    getLearningSettings(),
    overviewLoad,
    getPlatformI18n(),
    overviewLoad.then((o) => getReviewQueue(supabase, user.id, o.today)),
  ]);
  const r = t.review;
  const dayFormat = new Intl.DateTimeFormat(dateLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const hiddenPanels = parseHiddenPanels((await cookies()).get(LEARN_HIDDEN_COOKIE)?.value);

  return (
    <LearnPanelsProvider initialHidden={hiddenPanels}>
    <div className="space-y-6 sm:space-y-8">
      {/* Same header as Learn: title, then the one way back. */}
      <header className="rise flex flex-wrap items-center justify-between gap-3" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {r.title}
          <span className="text-primary">.</span>
        </h1>
        {/* The empty state has its own "Back to Learn", so only one way back shows. */}
        {cards.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {/* The progress panel's chip lands here once it is hidden (ReviewSession). */}
            <div id="review-chips" className="contents" />
          </div>
        )}
      </header>

      {cards.length > 0 ? (
        <ReviewSession
          cards={cards}
          language={settings.translationLanguage}
          locale={locale}
          t={r}
          c={t.triage}
          sessionEnded={t.common.sessionEnded}
          startXp={overview.xpTotal}
          rewards={t.rewards}
          panelLabels={t.learn}
        />
      ) : (
        <section className="max-w-xl border-[3px] border-line bg-raised p-6 shadow-brutal sm:p-8">
          <h2 className="font-display text-2xl font-black uppercase">{r.nothing}</h2>
          <p className="mt-3 font-semibold text-pretty text-muted">
            {overview.total === 0
              ? r.startSet
              : overview.nextDueOn
                ? fill(r.nextDue, { date: dayFormat.format(new Date(`${overview.nextDueOn}T00:00:00Z`)) })
                : overview.queued > 0
                  ? r.arriveTomorrow
                  : r.startAnother}
          </p>
          <Link href="/learn/new-words" className={buttonClasses({ className: "mt-6" })}>
            {overview.total === 0 ? r.getWords : r.backToLearn}
          </Link>
        </section>
      )}
    </div>
    </LearnPanelsProvider>
  );
}
