import type { Metadata } from "next";
import Link from "next/link";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { BackLink } from "@/components/learn/back-link";
import { RemoveWordButton } from "@/components/learn/remove-word-button";
import { buttonClasses } from "@/components/ui/button";
import { MY_WORDS_LIMIT, getMyWords } from "@/features/learning/word-lists";
import { utcDay } from "@/features/learning/stats";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getLearningSettings } from "@/features/settings/profile";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.myWords };
}

export default async function MyWordsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the platform layout already redirects

  const [{ settings }, { locale, t }] = await Promise.all([getLearningSettings(), getPlatformI18n()]);
  const m = t.myWords;
  const dayFormat = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", timeZone: "UTC" });
  const words = await getMyWords(supabase, user.id, settings.translationLanguage);
  const today = utcDay();

  const status = (dueOn: string | null) =>
    dueOn === null
      ? m.waiting
      : dueOn <= today
        ? m.dueToday
        : fill(m.next, { date: dayFormat.format(new Date(`${dueOn}T00:00:00Z`)) });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0">
          <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
            {m.title}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-2 font-semibold text-muted lg:mt-0">
            {plural(locale, words.length, t.common.words)}
            {words.length >= MY_WORDS_LIMIT && ` ${fill(m.showingLatest, { n: MY_WORDS_LIMIT })}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BackLink href="/learn/new-words" label={t.common.learn} />
          <Link href="/learn/known" className={buttonClasses({ variant: "secondary" })}>
            {t.learn.known}
          </Link>
          <Link href="/learn/add" className={buttonClasses()}>
            {m.addWord}
          </Link>
        </div>
      </header>

      {words.length === 0 ? (
        <p className="max-w-xl border-[3px] border-line bg-surface p-5 font-semibold shadow-brutal-md">{m.empty}</p>
      ) : (
        <ul className="divide-y-2 divide-line border-[3px] border-line bg-raised shadow-brutal">
          {words.map((word) => (
            <li key={word.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className={`border-2 border-line px-2 py-0.5 text-xs font-black ${leitnerBoxStyles[word.box]}`}>
                {word.dueOn === null ? m.queue : fill(m.box, { box: word.box })}
              </span>
              {/* min-w-36: on phones the date and Remove wrap below instead of crushing the word. */}
              <div className="min-w-36 flex-1">
                <p className="font-black break-words">
                  <Link
                    href={`/learn/words/${word.id}`}
                    lang="en"
                    className="underline decoration-2 underline-offset-4 hover:decoration-mark"
                  >
                    {word.lemma}
                  </Link>
                  {word.custom && (
                    <span className="ml-2 border-[2px] border-line bg-box-4 px-1.5 text-xs font-black text-on-box uppercase">
                      {m.mine}
                    </span>
                  )}
                </p>
                <p lang={settings.translationLanguage} className="text-sm font-semibold text-muted">
                  {word.translation ?? m.noTranslation}
                </p>
              </div>
              <span className="text-xs font-black uppercase">{status(word.dueOn)}</span>
              <RemoveWordButton wordId={word.id} lemma={word.lemma} custom={word.custom} t={m} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
