"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { pickNewWordsAction, triageWordAction } from "@/features/learning/actions/word-list.actions";
import type { CardFilters, TriageCard } from "@/features/learning/queries";

// One random dictionary word at a time: "I know it" keeps it as known,
// "Learn it" puts it in today's reviews (within the plan's daily limit).
export function WordTriage({
  initialCards,
  filters,
  language,
  learnedToday,
  limit,
  t,
  autoLabel,
  sessionEnded,
}: {
  initialCards: TriageCard[];
  filters: CardFilters;
  language: "ru" | "ro";
  learnedToday: number;
  limit: number | null; // null = unlimited
  t: PlatformDictionary["triage"];
  autoLabel: string;
  sessionEnded: string;
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [learned, setLearned] = useState(learnedToday);
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Starts at the Settings language; switching here only changes what this card shows.
  const [shownLanguage, setShownLanguage] = useState(language);

  const card = cards[0];
  const translation = card?.translations[shownLanguage] ?? null;
  const translatedDefinition = card?.definitions[shownLanguage] ?? null;
  const limitReached = limit !== null && learned >= limit;

  async function answer(known: boolean) {
    if (!card || pending || (!known && limitReached)) return;
    setPending(true);
    setError(null);
    try {
      const result = await triageWordAction({
        wordId: card.wordId,
        lemma: card.lemma,
        partOfSpeech: card.partOfSpeech,
        known,
      });
      if (!result.success) {
        if (result.error === "daily_limit") setLearned(limit ?? learned);
        else setError(result.error === "not_signed_in" ? sessionEnded : t.failed);
        return;
      }
      if (!known) setLearned((n) => n + 1);

      let rest = cards.slice(1);
      // Top up before the pile runs out; skip words already on screen.
      if (rest.length < 2) {
        const more = await pickNewWordsAction(filters);
        if (more.success) {
          const seen = new Set([card.lemma, ...rest.map((c) => c.lemma)]);
          rest = [...rest, ...more.cards.filter((c) => !seen.has(c.lemma))];
        }
      }
      setCards(rest);
      setRevealed(false);
      router.refresh();
    } catch {
      setError(t.failed);
    } finally {
      setPending(false);
    }
  }

  if (!card) {
    return (
      <p className="flex items-center gap-3 border-[3px] border-dashed border-line p-5 font-black">
        <Sparkles className="h-6 w-6 shrink-0" aria-hidden="true" />
        {filters.topics.length + filters.partsOfSpeech.length > 0 ? t.noMatch : t.allSeen}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-black tracking-widest uppercase">{t.title}</h2>
        <p className="text-xs font-black text-muted uppercase">
          {limit === null
            ? fill(t.learningTodayUnlimited, { done: learned })
            : fill(t.learningToday, { done: learned, limit })}
        </p>
      </div>

      <div key={card.lemma} className="card-in mt-3 border-[3px] border-line bg-raised p-5 shadow-brutal sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div lang="en" className="min-w-0">
            <p className="font-display text-[clamp(2rem,9vw,3.25rem)] leading-none font-black tracking-tight break-words">
              {card.lemma}
            </p>
            <p className="mt-2 font-bold text-muted">{[card.ipa, card.partOfSpeech].filter(Boolean).join(" · ")}</p>
          </div>
          {/* Level and the RU/RO switch: badge-sized on desktop, finger-sized on phones. */}
          <div className="flex shrink-0 items-center gap-2">
            {card.level && <span className="border-2 border-line px-2 py-0.5 text-xs font-black">{card.level}</span>}
            <div role="group" aria-label={t.translateTo} className="flex border-[2px] border-line">
              {(["ru", "ro"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={shownLanguage === code}
                  onClick={() => {
                    setShownLanguage(code);
                    setRevealed(true);
                  }}
                  className={`min-h-10 min-w-11 cursor-pointer px-2 text-xs sm:min-h-0 sm:min-w-0 sm:py-0.5 font-black uppercase ${
                    shownLanguage === code ? "bg-chip text-on-box" : "bg-raised text-fg hover:bg-surface"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(translatedDefinition ?? card.definition) && (
          <p lang={translatedDefinition ? shownLanguage : "en"} className="mt-4 font-semibold">
            {translatedDefinition ?? card.definition}
          </p>
        )}

        <div className="mt-4 min-h-12">
          {revealed ? (
            <div className="min-w-0">
              <p lang={shownLanguage} className="font-display text-xl font-black break-words">
                {translation?.translation ?? "—"}
                {translation && translation.alternatives.length > 0 && (
                  <span className="font-sans text-base font-semibold text-muted">
                    , {translation.alternatives.join(", ")}
                  </span>
                )}
              </p>
              {translation?.auto && <p className="mt-1 text-xs font-black text-muted uppercase">{autoLabel}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="min-h-11 cursor-pointer text-sm font-black uppercase underline decoration-[3px] underline-offset-4 hover:decoration-mark"
            >
              {t.show}
            </button>
          )}
        </div>

        <p className="mt-4 text-sm font-black uppercase">{t.question}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => void answer(true)}
            aria-disabled={pending}
            className="w-full px-3!"
          >
            <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
            {t.know}
          </Button>
          <Button onClick={() => void answer(false)} aria-disabled={pending || limitReached} className="w-full px-3!">
            <Plus className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
            {t.learn}
          </Button>
        </div>

        {limitReached && (
          <p className="mt-3 text-sm font-semibold">
            {fill(t.limitReached, { limit: limit ?? 0 })}{" "}
            <Link
              href="/subscription"
              className="font-black underline decoration-2 underline-offset-2 hover:decoration-mark"
            >
              {t.upgrade}
            </Link>
            .
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
