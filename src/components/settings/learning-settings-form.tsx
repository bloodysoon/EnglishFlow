"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { updateLearningSettingsAction } from "@/features/settings/actions/update-learning-settings.action";
import type { LearningSettings, TranslationLanguageSetting } from "@/features/settings/schemas";

const ERRORS = {
  invalid_data: "Those settings could not be saved. Please pick an option in each group.",
  not_signed_in: "Your session has ended. Please log in again.",
  unexpected: "Something went wrong. Please try again.",
} as const;

// Rough time per new word, for the hint under each goal.
const goalHint = (goal: number) => `about ${goal} min`;

export function LearningSettingsForm({ initial, goalOptions }: { initial: LearningSettings; goalOptions: number[] }) {
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
        legend="Translate words into"
        description="The language shown on the back of every word card."
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
        legend="Daily goal"
        description="How many new words to add each day. Reviews of words you already know don't count."
        value={dailyGoal}
        onChange={(value) => {
          setDailyGoal(value);
          setStatus(null);
        }}
        columns={goalOptions.length > 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3"}
        choices={goalOptions.map((goal) => ({ value: goal, label: `${goal} words`, hint: goalHint(goal) }))}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* aria-disabled keeps focus here; handleSubmit guards. */}
        <Button type="submit" aria-disabled={isSaving || !changed}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>

        <p role="status" className="text-sm font-black">
          {status?.kind === "saved" && "Saved ✓"}
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
