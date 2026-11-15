import type { Metadata } from "next";

import { BackLink } from "@/components/learn/back-link";
import { KnownQuiz } from "@/components/learn/known-quiz";
import { getPlatformI18n } from "@/features/i18n/platform";
import { pickKnownWords } from "@/features/learning/queries";
import { getLearningSettings } from "@/features/settings/profile";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.quiz };
}

export default async function KnownQuizPage({ searchParams }: PageProps<"/learn/known/quiz">) {
  const { count, round } = await searchParams;
  // Only the two sizes on offer; anything else gets 10.
  const size = count === "20" ? 20 : 10;
  const roundNumber = Number(round) || 0;

  const supabase = await createClient();
  const [{ settings }, { locale, t }] = await Promise.all([getLearningSettings(), getPlatformI18n()]);
  const cards = await pickKnownWords(supabase, settings.translationLanguage, size);

  return (
    <div className="space-y-8">
      <BackLink href="/learn/known" label={t.quiz.back} />
      <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
        {t.quiz.title}
        <span className="text-primary">.</span>
      </h1>
      {/* Each round is its own URL, so "Another quiz" starts fresh with new words. */}
      <KnownQuiz
        key={roundNumber}
        nextRoundHref={`/learn/known/quiz?count=${size}&round=${roundNumber + 1}`}
        cards={cards}
        language={settings.translationLanguage}
        locale={locale}
        t={t.quiz}
        sessionEnded={t.common.sessionEnded}
      />
    </div>
  );
}
