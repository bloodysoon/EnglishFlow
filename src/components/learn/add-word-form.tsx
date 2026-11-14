"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Search } from "lucide-react";

import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  addCustomWordAction,
  addWordsAction,
  lookupWordAction,
} from "@/features/learning/actions/word-list.actions";
import {
  CUSTOM_WORD_PARTS_OF_SPEECH,
  PART_OF_SPEECH_LABELS,
  lemmaSchema,
} from "@/features/learning/custom-word";
import type { WordLookup } from "@/features/learning/lookup";

type PartOfSpeech = (typeof CUSTOM_WORD_PARTS_OF_SPEECH)[number];
const LANGUAGE_NAMES = { ru: "Русский", ro: "Română" } as const;

const asPartOfSpeech = (value: string): PartOfSpeech =>
  (CUSTOM_WORD_PARTS_OF_SPEECH as readonly string[]).includes(value) ? (value as PartOfSpeech) : "";

const splitList = (text: string) =>
  text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

export function AddWordForm({ language }: { language: "ru" | "ro" }) {
  const [query, setQuery] = useState("");
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [lookup, setLookup] = useState<WordLookup | null>(null);
  const [ownVersion, setOwnVersion] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const queryRef = useRef<HTMLInputElement>(null);

  function reset() {
    setQuery("");
    setLookup(null);
    setOwnVersion(false);
    setDone(null);
    queryRef.current?.focus();
  }

  async function search(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLooking) return;

    const lemma = lemmaSchema.safeParse(query);
    if (!lemma.success) {
      setQueryError("Use English letters only, with single spaces, hyphens or apostrophes between words (up to 60 characters).");
      return;
    }

    setIsLooking(true);
    setQueryError(null);
    setLookup(null);
    setOwnVersion(false);
    setDone(null);
    try {
      const result = await lookupWordAction({ lemma: lemma.data });
      if (result.success) setLookup(result.result);
      else setQueryError(result.error === "not_signed_in" ? "Your session has ended. Please log in again." : "That word could not be looked up.");
    } catch {
      setQueryError("Lookup failed. Check your connection and try again.");
    } finally {
      setIsLooking(false);
    }
  }

  if (done) {
    return (
      <section className="card-in max-w-xl border-[3px] border-line bg-chip p-6 text-on-box shadow-brutal">
        <p className="flex items-center gap-2 font-display text-2xl font-black uppercase">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" /> Added
        </p>
        <p className="mt-2 font-semibold">
          <span lang="en" className="font-black">
            {done}
          </span>{" "}
          is in today&apos;s review.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/learn/review" className={buttonClasses()}>
            Review now
          </Link>
          <Button type="button" variant="secondary" onClick={reset}>
            Add another word
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={search} role="search" className="border-[3px] border-line bg-surface p-5 shadow-brutal sm:p-6">
        <Label htmlFor="word-query">English word or phrase</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            ref={queryRef}
            id="word-query"
            lang="en"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setQueryError(null);
            }}
            aria-invalid={queryError ? true : undefined}
            aria-describedby={queryError ? "word-query-error" : "word-query-hint"}
            placeholder="e.g. look forward to"
            className="flex-1"
          />
          <Button type="submit" aria-disabled={isLooking}>
            <Search className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            {isLooking ? "Looking up..." : "Look up"}
          </Button>
        </div>
        {queryError ? (
          <p id="word-query-error" role="alert" className="mt-2 text-sm font-black">
            {queryError}
          </p>
        ) : (
          <p id="word-query-hint" className="mt-2 text-sm font-semibold text-muted">
            We check our dictionary first, then Wiktionary.
          </p>
        )}
      </form>

      <div aria-live="polite">
        {lookup?.kind === "dictionary" && !ownVersion && (
          <DictionaryResult lookup={lookup} language={language} onAdded={setDone} onOwnVersion={() => setOwnVersion(true)} />
        )}

        {lookup && (lookup.kind !== "dictionary" || ownVersion) && (
          <CustomWordForm key={`${lookup.lemma}-${ownVersion}`} lookup={lookup} language={language} onAdded={setDone} />
        )}
      </div>
    </div>
  );
}

function DictionaryResult({
  lookup,
  language,
  onAdded,
  onOwnVersion,
}: {
  lookup: Extract<WordLookup, { kind: "dictionary" }>;
  language: "ru" | "ro";
  onAdded: (lemma: string) => void;
  onOwnVersion: () => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function add(id: string) {
    setPending(id);
    setError(null);
    try {
      const result = await addWordsAction({ wordIds: [id], startNow: true });
      if (result.success) onAdded(lookup.lemma);
      else setError("Could not add this word. Please try again.");
    } catch {
      setError("Could not add this word. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="card-in space-y-4 border-[3px] border-line bg-raised p-5 shadow-brutal">
      <h2 className="font-black uppercase">In our dictionary</h2>
      <ul className="space-y-3">
        {lookup.matches.map((match) => (
          <li key={match.id} className="flex flex-wrap items-center justify-between gap-3 border-[2px] border-line bg-surface p-4">
            <div>
              <p lang="en" className="font-display text-xl font-black">
                {lookup.lemma}{" "}
                <span className="text-sm font-bold text-muted">
                  {[match.partOfSpeech, match.level].filter(Boolean).join(" · ")}
                </span>
              </p>
              <p lang={language} className="font-semibold">
                {match.translation ?? "Translation coming soon"}
                {match.alternatives.length > 0 && <span className="text-muted">, {match.alternatives.join(", ")}</span>}
              </p>
            </div>
            {match.inMyWords ? (
              <p className="flex items-center gap-2 font-black">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> In your words
              </p>
            ) : (
              <Button type="button" onClick={() => add(match.id)} aria-disabled={pending !== null}>
                {pending === match.id ? "Adding..." : "Add to my words"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onOwnVersion}
        className="min-h-11 cursor-pointer text-sm font-black underline decoration-[3px] underline-offset-4 hover:decoration-mark"
      >
        Add my own translation instead
      </button>
    </section>
  );
}

function CustomWordForm({
  lookup,
  language,
  onAdded,
}: {
  lookup: WordLookup;
  language: "ru" | "ro";
  onAdded: (lemma: string) => void;
}) {
  const suggestion = lookup.kind === "suggestion" ? lookup : null;
  const [translation, setTranslation] = useState(suggestion?.translation ?? "");
  const [alternatives, setAlternatives] = useState(suggestion?.alternatives.join(", ") ?? "");
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>(asPartOfSpeech(suggestion?.partOfSpeech ?? ""));
  const [example, setExample] = useState(suggestion?.example ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    if (!translation.trim()) {
      setError(`Type the ${LANGUAGE_NAMES[language]} translation.`);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const result = await addCustomWordAction({
        lemma: lookup.lemma,
        partOfSpeech,
        language,
        translation,
        alternatives: splitList(alternatives).slice(0, 5),
        example: example.trim() || undefined,
        ipa: suggestion?.ipa ?? undefined,
      });
      if (result.success) onAdded(lookup.lemma);
      else
        setError(
          result.error === "daily_limit"
            ? "You've reached today's limit for new words. Try again tomorrow, or upgrade your plan."
            : result.error === "invalid_data"
              ? "Check the fields: translation up to 200 characters, at most 5 alternatives, example up to 300."
              : "Could not save this word. Please try again.",
        );
    } catch {
      setError("Could not save this word. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card-in space-y-5 border-[3px] border-line bg-raised p-5 shadow-brutal sm:p-6">
      <div>
        <h2 lang="en" className="font-display text-2xl font-black">
          {lookup.lemma}
          {suggestion?.ipa && <span className="ml-2 text-sm font-bold text-muted">{suggestion.ipa}</span>}
        </h2>
        <p className="mt-1 text-sm font-semibold text-muted">
          {suggestion
            ? suggestion.translation
              ? "Suggested from Wiktionary. Check it and fix anything before saving."
              : `Wiktionary has this word but no ${LANGUAGE_NAMES[language]} translation. Type it below.`
            : lookup.kind === "not_found"
              ? "Wiktionary doesn't know this word. Type the translation yourself."
              : "Your own translation, visible only to you."}
        </p>
      </div>

      <div>
        <Label htmlFor="custom-translation">Translation ({LANGUAGE_NAMES[language]})</Label>
        <Input
          id="custom-translation"
          lang={language}
          required
          maxLength={200}
          value={translation}
          onChange={(event) => {
            setTranslation(event.target.value);
            setError(null);
          }}
        />
      </div>

      <div>
        <Label htmlFor="custom-alternatives">Other translations</Label>
        <Input
          id="custom-alternatives"
          lang={language}
          value={alternatives}
          onChange={(event) => setAlternatives(event.target.value)}
          aria-describedby="custom-alternatives-hint"
        />
        <p id="custom-alternatives-hint" className="mt-1 text-xs font-semibold text-muted">
          Optional. Comma-separated, up to 5.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
        <div>
          <Label htmlFor="custom-pos">Part of speech</Label>
          <select
            id="custom-pos"
            value={partOfSpeech}
            onChange={(event) => setPartOfSpeech(asPartOfSpeech(event.target.value))}
            className="min-h-12 w-full cursor-pointer border-[3px] border-line bg-raised p-3 font-bold text-fg"
          >
            {CUSTOM_WORD_PARTS_OF_SPEECH.map((pos) => (
              <option key={pos} value={pos}>
                {PART_OF_SPEECH_LABELS[pos]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="custom-example">Example sentence</Label>
          <Input
            id="custom-example"
            lang="en"
            maxLength={300}
            value={example}
            onChange={(event) => setExample(event.target.value)}
            placeholder="Optional, in English"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
          {error}
        </p>
      )}

      <Button type="submit" aria-disabled={isSaving}>
        {isSaving ? "Adding..." : "Add to my words"}
      </Button>
    </form>
  );
}
