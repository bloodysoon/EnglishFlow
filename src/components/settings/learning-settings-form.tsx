"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { updateLearningSettingsAction } from "@/features/settings/actions/update-learning-settings.action";
import { fill, type Locale } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { plural, type Plural } from "@/features/i18n/plural";
import type { LearningSettings, TranslationLanguageSetting } from "@/features/settings/schemas";

export function LearningSettingsForm({
  initial,
  goalOptions,
  locale,
  t,
  words,
  sessionEnded,
  unexpected,
}: {
  initial: LearningSettings;
  goalOptions: number[];
  locale: Locale;
  t: PlatformDictionary["settings"];
  words: Plural;
  sessionEnded: string;
  unexpected: string;
}) {
  const ERRORS = { invalid_data: t.invalidSettings, not_signed_in: sessionEnded, unexpected };
  const [saved, setSaved] = useState(initial);
  const [translationLanguage, setTranslationLanguage] = useState(initial.translationLanguage);
  const [dailyGoal, setDailyGoal] = useState(initial.dailyGoal);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" } | { kind: "error"; message: string } | null>(null);

  const changed = translationLanguage !== saved.translationLanguage || dailyGoal !== saved.dailyGoal;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !changed) return;

    setIsSaving(true);
    setStatus(null);
    try {
      const next = { translationLanguage, dailyGoal };
      const result = await updateLearningSettingsAction(next);
      if (result.success) {
        setSaved(next);
        setStatus({ kind: "saved" });
      } else {
        setStatus({ kind: "error", message: ERRORS[result.error] });
      }
    } catch {
      setStatus({ kind: "error", message: ERRORS.unexpected });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <ChoiceGroup<TranslationLanguageSetting>
        name="translation-language"
        legend={t.translateInto}
        description={t.translateIntoDescription}
        columns="sm:grid-cols-2"
        value={translationLanguage}
        onChange={(value) => {
          setTranslationLanguage(value);
          setStatus(null);
        }}
        choices={[
          { value: "ru", label: "Русский", hint: "borrow → брать взаймы", lang: "ru" },
          { value: "ro", label: "Română", hint: "borrow → a împrumuta", lang: "ro" },
        ]}
      />

      <ChoiceGroup<number>
        name="daily-goal"
        legend={t.dailyGoal}
        description={t.dailyGoalDescription}
        value={dailyGoal}
        onChange={(value) => {
          setDailyGoal(value);
          setStatus(null);
        }}
        columns={goalOptions.length > 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3"}
        // Rough time: about a minute per new word.
        choices={goalOptions.map((goal) => ({
          value: goal,
          label: plural(locale, goal, words),
          hint: fill(t.goalHint, { n: goal }),
        }))}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* aria-disabled keeps focus here; handleSubmit guards. */}
        <Button type="submit" aria-disabled={isSaving || !changed}>
          {isSaving ? t.saving : t.save}
        </Button>

        <p role="status" className="text-sm font-black">
          {status?.kind === "saved" && t.saved}
        </p>
      </div>

      {status?.kind === "error" && (
        <p role="alert" className="border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
          {status.message}
        </p>
      )}
    </form>
  );
}
