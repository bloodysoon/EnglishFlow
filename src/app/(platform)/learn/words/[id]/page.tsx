import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { BackLink } from "@/components/learn/back-link";
import { SentenceCheck } from "@/components/learn/sentence-check";
import { WordExample, WordHead, WordTranslation } from "@/components/learn/word-card";
import { riseStyle } from "@/components/ui/rise";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getWordHistory } from "@/features/learning/queries";
import { utcDay } from "@/features/learning/stats";
import { withPractice } from "@/features/learning/timeline";
import { getLearningSettings } from "@/features/settings/profile";
import { getPracticeHistory } from "@/features/writing/history";
import { TENSE_INFO } from "@/features/writing/tenses";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

// My own copy of the word, or nothing: RLS and the user filter keep other learners' words out.
async function loadWord(params: Props["params"]) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? getWordHistory(supabase, user.id, id.data) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [word, { t }] = await Promise.all([loadWord(params), getPlatformI18n()]);
  return { title: word?.card.lemma ?? t.meta.myWords };
}

// One word: what it means, where it stands now, and everything that happened to it.
export default async function WordPage({ params }: Props) {
  const [word, { settings }, { locale, t }] = await Promise.all([
    loadWord(params),
    getLearningSettings(),
    getPlatformI18n(),
  ]);
  if (!word) notFound();
  const history = await getPracticeHistory(await createClient(), word.card.wordId);

  const w = t.wordPage;
  const m = t.myWords;
  const { card } = word;
  const steps = withPractice(word.steps, history);
  const language = settings.translationLanguage;
  const definition = card.definitions[language] ?? card.definition;
  const day = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", timeZone: "UTC" });
  const moment = new Intl.DateTimeFormat(dateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  const next =
    word.dueOn === null
      ? m.waiting
      : word.dueOn <= utcDay()
        ? m.dueToday
        : day.format(new Date(`${word.dueOn}T00:00:00Z`));
  const facts = word.known
    ? [[w.box, w.statusKnown]]
    : [
        [w.box, word.dueOn === null ? m.queue : card.box],
        [w.nextReview, next],
        [w.reviews, word.reviewCount],
      ];
  const tones = {
    added: "bg-box-2",
    known: "bg-box-4",
    remembered: "bg-primary",
    forgot: "bg-box-1",
    mastered: "bg-box-5",
    practice: "bg-box-3",
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <BackLink href={word.known ? "/learn/known" : "/learn/words"} label={word.known ? t.learn.known : m.title} />

      <section className="rise border-[3px] border-line bg-raised p-5 shadow-brutal sm:p-7" style={riseStyle(0)}>
        <h1 className="sr-only">{card.lemma}</h1>
        <WordHead
          lemma={card.lemma}
          ipa={card.ipa}
          partOfSpeech={card.partOfSpeech}
          language={language}
          listenLabel={t.triage.listen}
          translateLabel={t.triage.translateTo}
        >
          {!word.known && word.dueOn !== null && (
            <span
              className={`border-2 border-line px-2 py-0.5 text-xs font-black uppercase ${leitnerBoxStyles[card.box]}`}
            >
              {fill(m.box, { box: card.box })}
            </span>
          )}
          {card.level && <span className="border-2 border-line px-2 py-0.5 text-xs font-black">{card.level}</span>}
        </WordHead>

        <div className="mt-4">
          <WordTranslation
            translation={card.translations[language]}
            language={language}
            autoLabel={t.common.autoTranslation}
          />
        </div>
        {definition && (
          <p lang={card.definitions[language] ? language : "en"} className="mt-3 font-semibold">
            {definition}
          </p>
        )}
        {card.example && <WordExample example={card.example} lemma={card.lemma} label={t.triage.example} />}

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t-[2px] border-line pt-4">
          {facts.map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-xs font-semibold text-muted sm:text-sm">{label}</dt>
              <dd className="font-display text-xl font-black break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="rise" style={riseStyle(1)}>
        <SentenceCheck
          wordId={card.wordId}
          lemma={card.lemma}
          history={history}
          locale={locale}
          dateTag={dateLocale(locale)}
          t={t.sentenceCheck}
          common={t.common}
        />
      </div>

      <section aria-labelledby="timeline-title" className="rise" style={riseStyle(2)}>
        <h2 id="timeline-title" className="text-sm font-black tracking-widest uppercase">
          {w.timeline}
        </h2>
        {/* Newest first; the line on the left ties the steps together. */}
        <ol className="mt-4 ml-2 space-y-5 border-l-[3px] border-line">
          {[...steps].reverse().map((step, i) => (
            <li key={i} className="relative pl-6">
              <span
                aria-hidden="true"
                className={`absolute top-1 -left-[9.5px] h-4 w-4 border-[2px] border-line ${tones[step.kind]}`}
              />
              <p className="font-black">
                {w[step.kind]}
                {step.xp > 0 && <span className="ml-2 font-display text-sm text-muted">+{step.xp} XP</span>}
              </p>
              {step.practice && (
                <>
                  <p lang="en" className="mt-1 font-semibold break-words">
                    {step.practice.sentence}
                  </p>
                  <p className="text-sm font-semibold">
                    {step.practice.tense && (
                      <span lang="en">
                        {step.practice.tenseOk ? "✓" : "✗"} {TENSE_INFO[step.practice.tense].name} ·{" "}
                      </span>
                    )}
                    {step.practice.issues.length === 0
                      ? t.sentenceCheck.clean
                      : plural(locale, step.practice.issues.length, t.sentenceCheck.mistakes)}
                  </p>
                </>
              )}
              {step.from !== undefined && step.to !== undefined && (
                <p className="text-sm font-semibold">{fill(w.boxMove, { from: step.from, to: step.to })}</p>
              )}
              <time dateTime={step.at} className="text-sm font-semibold text-muted">
                {moment.format(new Date(step.at))}
              </time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
