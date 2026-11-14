"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fill, type Locale } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { addWordsAction } from "@/features/learning/actions/word-list.actions";
import type { SetWord } from "@/features/learning/word-lists";

export function SetWordPicker({
  words,
  language,
  locale,
  t,
  sessionEnded,
  adding,
}: {
  words: SetWord[];
  language: "ru" | "ro";
  locale: Locale;
  t: PlatformDictionary["wordSet"];
  sessionEnded: string;
  adding: string;
}) {
  const router = useRouter();
  const available = useMemo(() => words.filter((w) => !w.inMyWords), [words]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "added"; count: number } | { kind: "error"; message: string } | null>(null);

  const allSelected = available.length > 0 && available.every((w) => selected.has(w.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setStatus(null);
  }

  async function add() {
    if (isSaving || selected.size === 0) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const result = await addWordsAction({ wordIds: [...selected], startNow: false });
      if (result.success) {
        setStatus({ kind: "added", count: result.added });
        setSelected(new Set());
        router.refresh();
      } else {
        setStatus({
          kind: "error",
          message: result.error === "not_signed_in" ? sessionEnded : t.addFailed,
        });
      }
    } catch {
      setStatus({ kind: "error", message: t.addFailed });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {available.length > 0 && (
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 font-black">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(available.map((w) => w.id)))}
            className="h-5 w-5 cursor-pointer accent-[var(--primary)]"
          />
          {fill(t.selectAll, { n: available.length })}
        </label>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {words.map((word) => {
          const checked = selected.has(word.id);
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span lang="en" className="block font-display text-lg font-black break-words">
                  {word.lemma}
                </span>
                <span className="block text-xs font-semibold opacity-75">
                  {[word.partOfSpeech, word.ipa].filter(Boolean).join(" · ")}
                </span>
                <span lang={language} className="mt-1 block font-semibold">
                  {word.translation ?? t.translationSoon}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-2">
                {word.level && <span className="border-2 border-line px-1.5 text-xs font-black">{word.level}</span>}
              </span>
            </>
          );

          return (
            <li key={word.id}>
              {word.inMyWords ? (
                <div className="flex gap-3 border-[3px] border-line bg-chip p-4 text-on-box">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-label={t.inYourWordsAria} />
                  {body}
                </div>
              ) : (
                <label
                  className={`flex cursor-pointer gap-3 border-[3px] border-line p-4 shadow-brutal-sm transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:shadow-brutal-md has-focus-visible:outline-[3px] has-focus-visible:outline-offset-[3px] has-focus-visible:outline-fg motion-reduce:transition-none ${
                    checked ? "bg-box-2 text-on-box" : "bg-raised text-fg"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(word.id)}
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[var(--primary)] focus-visible:outline-none"
                  />
                  {body}
                </label>
              )}
            </li>
          );
        })}
      </ul>

      {/* Sticks to the bottom while picking. */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 border-[3px] border-line bg-surface p-3 shadow-brutal">
        <Button type="button" onClick={add} aria-disabled={isSaving || selected.size === 0}>
          {isSaving ? adding : fill(t.addSelected, { n: selected.size })}
        </Button>
        <p role="status" className="text-sm font-black">
          {status?.kind === "added" &&
            (status.count > 0
              ? plural(locale, status.count, t.addedStatus)
              : t.alreadyIn)}
        </p>
        {status?.kind === "error" && (
          <p role="alert" className="w-full border-[3px] border-line bg-box-1 p-2 text-sm font-semibold text-on-box">
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
