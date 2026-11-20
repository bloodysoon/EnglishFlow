"use client";

import { useState } from "react";

import { ADMIN_ERRORS, SaveStatus } from "@/components/admin/admin-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateWordAction } from "@/features/admin/actions/update-word.action";
import { wordEditSchema } from "@/features/admin/schemas";
import type { AdminWord } from "@/features/admin/word-sets";
import { CEFR_LEVELS, type CefrLevel } from "@/features/dictionary/cefr";

type TranslationFields = { translation: string; alternatives: string; reviewed: boolean } | null;

const LANGUAGES = [
  { code: "ru", name: "Русский" },
  { code: "ro", name: "Română" },
  { code: "id", name: "Bahasa Indonesia" },
] as const;

const toFields = (word: AdminWord): Record<"ru" | "ro" | "id", TranslationFields> => ({
  ru: word.translations.ru
    ? { translation: word.translations.ru.translation, alternatives: word.translations.ru.alternatives.join(", "), reviewed: word.translations.ru.reviewed }
    : null,
  ro: word.translations.ro
    ? { translation: word.translations.ro.translation, alternatives: word.translations.ro.alternatives.join(", "), reviewed: word.translations.ro.reviewed }
    : null,
  id: word.translations.id
    ? { translation: word.translations.id.translation, alternatives: word.translations.id.alternatives.join(", "), reviewed: word.translations.id.reviewed }
    : null,
});

const splitAlternatives = (text: string) =>
  text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

export function WordEditor({ word }: { word: AdminWord }) {
  const [level, setLevel] = useState<CefrLevel | "">(word.level ?? "");
  const [translations, setTranslations] = useState(() => toFields(word));
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" } | { kind: "error"; message: string } | null>(null);

  const id = (suffix: string) => `word-${word.id}-${suffix}`;

  function update(language: "ru" | "ro" | "id", patch: Partial<NonNullable<TranslationFields>> | null) {
    setTranslations((prev) => ({
      ...prev,
      [language]: patch === null ? null : { ...(prev[language] ?? { translation: "", alternatives: "", reviewed: false }), ...patch },
    }));
    setStatus(null);
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const edit = {
      wordId: word.id,
      level: level || null,
      translations: Object.fromEntries(
        LANGUAGES.map(({ code }) => {
          const t = translations[code];
          return [code, t ? { translation: t.translation.trim(), alternatives: splitAlternatives(t.alternatives), reviewed: t.reviewed } : null];
        }),
      ),
    };

    const parsed = wordEditSchema.safeParse(edit);
    if (!parsed.success) {
      setStatus({ kind: "error", message: "Each translation needs text (up to 200 characters) and at most 5 alternatives." });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      const result = await updateWordAction(parsed.data);
      setStatus(result.success ? { kind: "saved" } : { kind: "error", message: ADMIN_ERRORS[result.error] });
    } catch {
      setStatus({ kind: "error", message: ADMIN_ERRORS.unexpected });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-[3px] border-line bg-surface p-5 shadow-brutal-md">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 lang="en" className="font-display text-2xl font-black">
          {word.lemma}
          {word.partOfSpeech && <span className="ml-2 text-sm font-bold text-muted">{word.partOfSpeech}</span>}
        </h3>
        {word.ipa && <span className="text-sm font-semibold text-muted">{word.ipa}</span>}
      </div>
      {word.example && (
        <p lang="en" className="mt-1 text-sm font-semibold text-muted italic">
          “{word.example}”
        </p>
      )}

      <div className="mt-4 max-w-[220px]">
        <Label htmlFor={id("level")} className="text-sm">
          CEFR level
        </Label>
        <select
          id={id("level")}
          value={level}
          onChange={(event) => {
            setLevel(event.target.value as CefrLevel | "");
            setStatus(null);
          }}
          aria-describedby={id("level-source")}
          className="min-h-12 w-full cursor-pointer border-[3px] border-line bg-raised p-3 font-black text-fg"
        >
          <option value="">No level (counts as A1)</option>
          {CEFR_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <p id={id("level-source")} className="mt-1 text-xs font-semibold text-muted">
          Source: {word.levelSource ?? "none"}
        </p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {LANGUAGES.map(({ code, name }) => {
          const t = translations[code];
          return (
            <fieldset key={code} className="border-[2px] border-dashed border-line p-4">
              <legend lang={code} className="px-1 font-black uppercase">
                {name}
              </legend>

              {t ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={id(`${code}-translation`)} className="text-sm">
                      Translation
                    </Label>
                    <Input
                      id={id(`${code}-translation`)}
                      lang={code}
                      value={t.translation}
                      maxLength={200}
                      onChange={(event) => update(code, { translation: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={id(`${code}-alternatives`)} className="text-sm">
                      Alternatives
                    </Label>
                    <Input
                      id={id(`${code}-alternatives`)}
                      lang={code}
                      value={t.alternatives}
                      onChange={(event) => update(code, { alternatives: event.target.value })}
                      aria-describedby={id(`${code}-alternatives-hint`)}
                    />
                    <p id={id(`${code}-alternatives-hint`)} className="mt-1 text-xs font-semibold text-muted">
                      Comma-separated, up to 5.
                    </p>
                  </div>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 font-black">
                    <input
                      type="checkbox"
                      checked={t.reviewed}
                      onChange={(event) => update(code, { reviewed: event.target.checked })}
                      className="h-5 w-5 cursor-pointer accent-[var(--primary)]"
                    />
                    Reviewed (visible to learners)
                  </label>
                  <button
                    type="button"
                    onClick={() => update(code, null)}
                    className="min-h-11 cursor-pointer text-sm font-black underline decoration-[3px] underline-offset-4 hover:decoration-mark"
                  >
                    Remove translation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-black">No translation yet.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={() => update(code, {})}>
                    Add translation
                  </Button>
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" aria-disabled={isSaving}>
          {isSaving ? "Saving..." : "Save word"}
        </Button>
        <SaveStatus status={status} />
      </div>
    </form>
  );
}
