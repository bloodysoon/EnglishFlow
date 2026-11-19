"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Input, Label } from "@/components/ui/input";
import { updateLearningSettingsAction } from "@/features/settings/actions/update-learning-settings.action";
import { fill, type Locale } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { plural, type Plural } from "@/features/i18n/plural";
import type { LearningSettings, TranslationLanguageSetting } from "@/features/settings/schemas";

export function LearningSettingsForm({
  initial,
  goalOptions,
  maxGoal,
  locale,
  t,
  words,
  sessionEnded,
  unexpected,
}: {
  initial: LearningSettings;
  goalOptions: number[];
  maxGoal: number;
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
  // A saved goal that isn't one of the options was typed by the learner.
  const [custom, setCustom] = useState(!goalOptions.includes(initial.dailyGoal));
  // Focus the number field only when the visitor picks "Custom" here, not
  // when a saved custom goal shows it on load (that would steal focus and
  // pop up the phone keyboard).
  const [focusCustom, setFocusCustom] = useState(false);
  const [customText, setCustomText] = useState(custom ? String(initial.dailyGoal) : "");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" } | { kind: "error"; message: string } | null>(null);

  const goal = custom ? Number(customText) : dailyGoal;
  const goalValid = Number.isInteger(goal) && goal >= 1 && goal <= maxGoal;
  const changed = translationLanguage !== saved.translationLanguage || goal !== saved.dailyGoal;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !changed) return;
    if (!goalValid) {
      setStatus({ kind: "error", message: fill(t.invalidCustomGoal, { max: maxGoal }) });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      const next = { translationLanguage, dailyGoal: goal };
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

      <div>
        <ChoiceGroup<number | "custom">
          name="daily-goal"
          legend={t.dailyGoal}
          description={t.dailyGoalDescription}
          value={custom ? "custom" : dailyGoal}
          onChange={(value) => {
            setCustom(value === "custom");
            setFocusCustom(value === "custom");
            if (value !== "custom") setDailyGoal(value);
            setStatus(null);
          }}
          columns="grid-cols-2 sm:grid-cols-4"
          choices={[
            // Rough time: about a minute per new word.
            ...goalOptions.map((option) => ({
              value: option,
              label: plural(locale, option, words),
              hint: fill(t.goalHint, { n: option }),
            })),
            { value: "custom" as const, label: t.customGoal, hint: fill(t.customGoalHint, { max: maxGoal }) },
          ]}
        />

        {custom && (
          <div className="mt-4 max-w-48">
            <Label htmlFor="custom-goal">{t.customGoalLabel}</Label>
            <Input
              id="custom-goal"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxGoal}
              step={1}
              autoFocus={focusCustom}
              value={customText}
              onChange={(event) => {
                setCustomText(event.target.value);
                setStatus(null);
              }}
              aria-invalid={customText !== "" && !goalValid ? true : undefined}
              aria-describedby="custom-goal-hint"
            />
            <p id="custom-goal-hint" className="mt-1 text-xs font-semibold text-muted">
              {fill(t.invalidCustomGoal, { max: maxGoal })}
            </p>
          </div>
        )}
      </div>

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
