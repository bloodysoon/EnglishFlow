"use client";

import type { ReactNode } from "react";
import { Volume2 } from "lucide-react";

import { splitAroundWord } from "@/features/learning/highlight";
import type { CardTranslation } from "@/features/learning/queries";

// The pieces of a word card shared by Learn (sorting new words) and Review.

// The browser's own voice (Web Speech API); silently does nothing where it is missing.
export function speak(lemma: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(lemma);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// Static badges beside the word (level, Leitner box): flat, so they never look tappable.
export const wordBadge = "inline-flex items-center border-2 border-line px-2 py-0.5 text-xs font-black uppercase";

// The word with its listen button, then the badges (children) and the RU/RO switch.
export function WordHead({
  lemma,
  ipa,
  partOfSpeech,
  language,
  onLanguage,
  listenLabel,
  translateLabel,
  children,
}: {
  lemma: string;
  ipa: string | null;
  partOfSpeech: string;
  language: "ru" | "ro" | "id";
  onLanguage?: (language: "ru" | "ro" | "id") => void; // no switch when missing
  listenLabel: string;
  translateLabel: string;
  children?: ReactNode;
}) {
  return (
    // Phones: badges get their own row above the word, so the word has the
    // card's full width (beside them it had ~100px and ran under them).
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <p
            lang="en"
            className="font-display min-w-0 text-[clamp(2rem,9vw,3.25rem)] leading-none font-black tracking-tight hyphens-auto wrap-anywhere"
          >
            {lemma}
          </p>
          <button
            type="button"
            onClick={() => speak(lemma)}
            aria-label={listenLabel}
            title={listenLabel}
            aria-keyshortcuts="P"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border-[2px] border-line bg-raised shadow-brutal-sm hover:bg-box-2 hover:text-on-box active:translate-x-0.5 active:translate-y-0.5 active:shadow-none motion-reduce:transition-none"
          >
            <Volume2 className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
        <p lang="en" className="mt-2 font-bold text-muted">
          {[ipa, partOfSpeech].filter(Boolean).join(" · ")}
        </p>
      </div>
      {/* Phones: badges left, switch right, on one row. Desktop: both top right, badge-sized.
          Tappable things carry a border and a hard shadow; the badges stay flat. */}
      <div className="flex shrink-0 items-center gap-1.5 sm:justify-end sm:gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">{children}</div>
        {onLanguage && (
          <div
            role="group"
            aria-label={translateLabel}
            className="ml-auto flex divide-x-2 divide-line border-[2px] border-line shadow-brutal-sm sm:ml-0"
          >
            {(["ru", "ro", "id"] as const).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={language === code}
                onClick={() => onLanguage(code)}
                className={`min-h-11 min-w-10 cursor-pointer px-2 text-xs font-black uppercase sm:min-h-0 sm:min-w-0 sm:py-0.5 ${
                  language === code ? "bg-chip text-on-box" : "bg-raised text-fg hover:bg-surface"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WordExample({ example, lemma, label }: { example: string; lemma: string; label: string }) {
  return (
    <div className="mt-4 bg-surface p-3 sm:p-4">
      <p className="text-xs font-black tracking-widest text-muted uppercase">{label}</p>
      <p lang="en" className="mt-1 font-semibold">
        {splitAroundWord(example, lemma).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}
      </p>
    </div>
  );
}

export function WordTranslation({
  translation,
  language,
  autoLabel,
}: {
  translation: CardTranslation | null;
  language: "ru" | "ro" | "id";
  autoLabel: string;
}) {
  return (
    <div className="min-w-0">
      <p lang={language} className="font-display text-xl font-black break-words">
        {translation?.translation ?? "—"}
        {translation && translation.alternatives.length > 0 && (
          <span className="font-sans text-base font-semibold text-muted">, {translation.alternatives.join(", ")}</span>
        )}
      </p>
      {translation?.auto && <p className="mt-1 text-xs font-black text-muted uppercase">{autoLabel}</p>}
    </div>
  );
}
