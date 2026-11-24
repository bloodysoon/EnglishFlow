import type { Metadata } from "next";
import Link from "next/link";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { BackLink } from "@/components/learn/back-link";
import { getMyWords } from "@/features/learning/word-lists";
import { timeUntilDue, type TimeLeft } from "@/features/learning/boxes";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getLearningSettings } from "@/features/settings/profile";
import { createClient } from "@/lib/supabase/server";

const BOXES = [1, 2, 3, 4, 5] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.boxes };
}

type Props = { searchParams: Promise<{ box?: string }> };

// The five Leitner boxes with how many words each holds; picking one lists
// its words with how long until each can be reviewed again.
export default async function BoxesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the platform layout already redirects

  const [{ settings }, { locale, t }, { box }] = await Promise.all([
    getLearningSettings(),
    getPlatformI18n(),
    searchParams,
  ]);
  const b = t.boxes;
  // Words still waiting in the queue (no due date) are in no box yet.
  const words = (await getMyWords(supabase, user.id, settings.translationLanguage)).filter((w) => w.dueOn !== null);
  const dayFormat = new Intl.DateTimeFormat(dateLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const selected = BOXES.find((n) => String(n) === box) ?? null;
  const inBox = (n: number) => words.filter((w) => w.box === n);

  const now = new Date();
  // "in 1 d 5 h 32 min": zero units are left out, minutes stay when nothing else does.
  const countdown = ({ days, hours, minutes }: TimeLeft) => {
    const parts = [
      days && fill(b.unitDays, { n: days }),
      hours && fill(b.unitHours, { n: hours }),
      (minutes || (!days && !hours)) && fill(b.unitMinutes, { n: minutes }),
    ].filter(Boolean);
    return fill(b.inTime, { time: parts.join(" ") });
  };

  const shown = selected
    ? inBox(selected).sort((x, y) => x.dueOn!.localeCompare(y.dueOn!) || x.lemma.localeCompare(y.lemma))
    : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
            {b.title}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-2 max-w-xl font-semibold text-muted">{b.lead}</p>
        </div>
        <BackLink href="/learn/new-words" label={t.common.learn} />
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {BOXES.map((n) => {
          const active = n === selected;
          return (
            <li key={n} className={n === 5 ? "col-span-2 sm:col-span-1" : ""}>
              <Link
                href={active ? "/learn/boxes" : `/learn/boxes?box=${n}`}
                aria-current={active ? "true" : undefined}
                scroll={false}
                className={`flex min-h-24 flex-col justify-between border-[3px] border-line p-3 font-black uppercase transition-transform duration-150 motion-reduce:transition-none ${leitnerBoxStyles[n]} ${
                  active ? "translate-x-1 translate-y-1 shadow-none" : "shadow-brutal hover:-translate-y-0.5"
                }`}
              >
                <span className="text-sm">{fill(t.myWords.box, { box: n })}</span>
                <span className="text-2xl">{plural(locale, inBox(n).length, b.count)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {selected === null ? (
        <p className="font-semibold text-muted">{b.pick}</p>
      ) : shown.length === 0 ? (
        <p className="max-w-xl border-[3px] border-line bg-surface p-5 font-semibold shadow-brutal-md">{b.empty}</p>
      ) : (
        <ul className="divide-y-2 divide-line border-[3px] border-line bg-raised shadow-brutal">
          {shown.map((word) => {
            const left = timeUntilDue(word.dueOn!, now);
            return (
              <li key={word.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/learn/words/${word.id}`}
                    lang="en"
                    className="font-black break-words underline decoration-2 underline-offset-4 hover:decoration-mark"
                  >
                    {word.lemma}
                  </Link>
                  {word.translation && <p className="text-sm font-semibold text-muted">{word.translation}</p>}
                </div>
                <span
                  className={`border-2 border-line px-2 py-0.5 text-xs font-black whitespace-nowrap uppercase ${
                    left === null ? "bg-primary text-on-primary" : "bg-surface"
                  }`}
                >
                  {left === null
                    ? b.dueToday
                    : `${countdown(left)} · ${dayFormat.format(new Date(`${word.dueOn}T00:00:00Z`))}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
