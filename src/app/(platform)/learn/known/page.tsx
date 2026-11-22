import type { Metadata } from "next";
import Link from "next/link";

import { BackLink } from "@/components/learn/back-link";
import { buttonClasses } from "@/components/ui/button";
import { fill } from "@/features/i18n/locales";
import { getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getMyWords } from "@/features/learning/word-lists";
import { getLearningSettings } from "@/features/settings/profile";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.known };
}

export default async function KnownWordsPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { settings },
    { locale, t },
  ] = await Promise.all([supabase.auth.getUser(), getLearningSettings(), getPlatformI18n()]);
  if (!user) return null; // the platform layout already redirects

  const words = await getMyWords(supabase, user.id, settings.translationLanguage, true);
  const k = t.known;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0">
          <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
            {k.title}
            <span className="text-primary">.</span>
          </h1>
          <p className="max-w-xl font-semibold text-muted">{k.lead}</p>
          {words.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2 lg:basis-full lg:pt-3">
              {[10, 20].map((n) => (
                <Link
                  key={n}
                  href={`/learn/known/quiz?count=${n}`}
                  className={buttonClasses({ variant: n === 10 ? "primary" : "secondary" })}
                >
                  {fill(k.quiz, { n })}
                </Link>
              ))}
            </div>
          )}
        </div>
        <BackLink href="/learn/new-words" label={t.common.learn} />
      </header>

      {words.length === 0 ? (
        <p className="max-w-xl border-[3px] border-line bg-surface p-5 font-semibold shadow-brutal-md">{k.empty}</p>
      ) : (
        <section>
          <p className="mb-3 text-sm font-black uppercase">{plural(locale, words.length, t.common.words)}</p>
          <ul className="divide-y-2 divide-line border-[3px] border-line bg-raised shadow-brutal">
            {words.map((word) => (
              <li key={word.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                <Link
                  href={`/learn/words/${word.id}`}
                  lang="en"
                  className="font-black break-words underline decoration-2 underline-offset-4 hover:decoration-mark"
                >
                  {word.lemma}
                </Link>
                <span lang={settings.translationLanguage} className="text-sm font-semibold text-muted">
                  {word.translation ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
