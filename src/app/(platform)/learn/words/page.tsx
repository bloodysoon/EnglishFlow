import type { Metadata } from "next";
import Link from "next/link";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { BackLink } from "@/components/learn/back-link";
import { RemoveWordButton } from "@/components/learn/remove-word-button";
import { buttonClasses } from "@/components/ui/button";
import { MY_WORDS_LIMIT, getMyWords } from "@/features/learning/word-lists";
import { utcDay } from "@/features/learning/stats";
import { getLearningSettings } from "@/features/settings/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My words" };

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function MyWordsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the platform layout already redirects

  const { settings } = await getLearningSettings();
  const words = await getMyWords(supabase, user.id, settings.translationLanguage);
  const today = utcDay();

  const status = (dueOn: string | null) =>
    dueOn === null ? "Waiting" : dueOn <= today ? "Due today" : `Next: ${dayFormat.format(new Date(`${dueOn}T00:00:00Z`))}`;

  return (
    <div className="space-y-8">
      <BackLink href="/learn" label="Learn" />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
            My words<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 font-semibold text-muted">
            {words.length} {words.length === 1 ? "word" : "words"}
            {words.length >= MY_WORDS_LIMIT && ` (showing the latest ${MY_WORDS_LIMIT})`}
          </p>
        </div>
        <Link href="/learn/add" className={buttonClasses()}>
          Add a word
        </Link>
      </header>

      {words.length === 0 ? (
        <p className="max-w-xl border-[3px] border-line bg-surface p-5 font-semibold shadow-brutal-md">
          No words yet. Start a word set or add your own word.
        </p>
      ) : (
        <ul className="divide-y-2 divide-line border-[3px] border-line bg-raised shadow-brutal">
          {words.map((word) => (
            <li key={word.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className={`border-2 border-line px-2 py-0.5 text-xs font-black ${leitnerBoxStyles[word.box]}`}>
                {word.dueOn === null ? "Queue" : `Box ${word.box}`}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black break-words">
                  <span lang="en">{word.lemma}</span>
                  {word.custom && (
                    <span className="ml-2 border-[2px] border-line bg-box-4 px-1.5 text-[10px] font-black text-on-box uppercase">
                      Mine
                    </span>
                  )}
                </p>
                <p lang={settings.translationLanguage} className="text-sm font-semibold text-muted">
                  {word.translation ?? "No translation yet"}
                </p>
              </div>
              <span className="text-xs font-black uppercase">{status(word.dueOn)}</span>
              <RemoveWordButton wordId={word.id} lemma={word.lemma} custom={word.custom} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
