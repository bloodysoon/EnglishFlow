import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { BackLink } from "@/components/learn/back-link";
import { HardWordList } from "@/components/learn/hard-word-list";
import { buttonClasses } from "@/components/ui/button";
import { fill } from "@/features/i18n/locales";
import { getPlatformI18n } from "@/features/i18n/platform";
import { getHardWords } from "@/features/learning/queries";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 25;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.hardWords };
}

export default async function HardWordsPage({ searchParams }: PageProps<"/learn/hard-words">) {
  const { page: pageParam } = await searchParams;
  // Anything that is not a whole number ≥ 1 means the first page; the cap keeps the offset a valid SQL integer.
  const page = Math.min(Math.max(1, Math.floor(Number(pageParam)) || 1), 10_000);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  // One extra row tells whether a next page exists, without counting them all.
  const [rows, { locale, t }] = await Promise.all([
    getHardWords(supabase, PAGE_SIZE + 1, offset),
    getPlatformI18n(),
  ]);
  const words = rows.slice(0, PAGE_SIZE);
  const hasNext = rows.length > PAGE_SIZE;
  const d = t.dashboard;

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard" label={t.nav.dashboard} />
      <header className="space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0">
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {d.hardWords}
          <span className="text-primary">.</span>
        </h1>
        <p className="max-w-xl font-semibold text-muted">{d.hardWordsHint}</p>
      </header>

      {words.length === 0 ? (
        <p className="max-w-xl border-[3px] border-line bg-surface p-5 font-semibold shadow-brutal-md">
          {d.hardWordsEmpty}
        </p>
      ) : (
        <HardWordList words={words} locale={locale} d={d} start={offset + 1} />
      )}

      {(page > 1 || hasNext) && (
        <nav aria-label={d.pages} className="flex flex-wrap items-center justify-between gap-3">
          {page > 1 ? (
            <Link
              href={page === 2 ? "/learn/hard-words" : `/learn/hard-words?page=${page - 1}`}
              className={buttonClasses({ variant: "secondary", className: "gap-2" })}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {d.prevPage}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm font-black uppercase" aria-current="page">
            {fill(d.pageN, { n: page })}
          </span>
          {hasNext ? (
            <Link
              href={`/learn/hard-words?page=${page + 1}`}
              className={buttonClasses({ variant: "secondary", className: "gap-2" })}
            >
              {d.nextPage}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
