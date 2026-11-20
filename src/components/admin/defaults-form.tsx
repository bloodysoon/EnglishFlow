"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { ADMIN_ERRORS, SaveStatus } from "@/components/admin/admin-card";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Input, Label } from "@/components/ui/input";
import { updateAppSettingsAction } from "@/features/admin/actions/update-app-settings.action";
import type { AppSettings } from "@/features/settings/app-settings";

const MAX_OPTIONS = 6;

export function DefaultsForm({ initial }: { initial: AppSettings }) {
  const [language, setLanguage] = useState(initial.defaultTranslationLanguage);
  const [options, setOptions] = useState(initial.dailyGoalOptions);
  const [defaultGoal, setDefaultGoal] = useState(initial.defaultDailyGoal);
  const [newOption, setNewOption] = useState("");
  const [optionError, setOptionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" } | { kind: "error"; message: string } | null>(null);

  function touch() {
    setStatus(null);
  }

  function addOption() {
    const value = Number(newOption);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      setOptionError("Enter a whole number from 1 to 100.");
      return;
    }
    if (options.includes(value)) {
      setOptionError(`${value} is already an option.`);
      return;
    }
    setOptions([...options, value].sort((a, b) => a - b));
    setNewOption("");
    setOptionError(null);
    touch();
  }

  function removeOption(value: number) {
    const next = options.filter((o) => o !== value);
    setOptions(next);
    if (defaultGoal === value) setDefaultGoal(next[0]);
    touch();
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const result = await updateAppSettingsAction({
        defaultTranslationLanguage: language,
        defaultDailyGoal: defaultGoal,
        dailyGoalOptions: options,
      });
      setStatus(result.success ? { kind: "saved" } : { kind: "error", message: ADMIN_ERRORS[result.error] });
    } catch {
      setStatus({ kind: "error", message: ADMIN_ERRORS.unexpected });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <ChoiceGroup<"ru" | "ro" | "id">
        name="default-translation-language"
        legend="Default translation language"
        description="What new learners see on the back of word cards until they change it."
        columns="sm:grid-cols-2"
        value={language}
        onChange={(value) => {
          setLanguage(value);
          touch();
        }}
        choices={[
          { value: "ru", label: "Русский", lang: "ru" },
          { value: "ro", label: "Română", lang: "ro" },
          { value: "id", label: "Bahasa Indonesia", lang: "id" },
        ]}
      />

      <fieldset>
        <legend className="font-black uppercase">Daily goal options</legend>
        <p className="mt-1 text-sm font-semibold text-muted">
          The choices learners get in their settings: 1 to {MAX_OPTIONS} options, each 1–100 new words a day.
        </p>

        <ul className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => (
            <li key={option}>
              <span className="inline-flex min-h-11 items-center gap-2 border-[2px] border-line bg-raised pr-1 pl-3 font-black shadow-brutal-sm">
                {option} words
                <button
                  type="button"
                  onClick={() => removeOption(option)}
                  disabled={options.length === 1}
                  aria-label={`Remove ${option} words`}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center border-l-[2px] border-line hover:bg-box-1 hover:text-on-box disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>

        {options.length < MAX_OPTIONS && (
          <div className="mt-4 flex max-w-sm items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="new-goal-option" className="text-sm">
                Add option
              </Label>
              <Input
                id="new-goal-option"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={newOption}
                onChange={(event) => {
                  setNewOption(event.target.value);
                  setOptionError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addOption();
                  }
                }}
                aria-invalid={optionError ? true : undefined}
                aria-describedby={optionError ? "new-goal-option-error" : undefined}
                placeholder="15"
              />
            </div>
            <Button type="button" variant="secondary" onClick={addOption}>
              Add
            </Button>
          </div>
        )}
        {optionError && (
          <p id="new-goal-option-error" className="mt-2 text-sm font-black">
            {optionError}
          </p>
        )}
      </fieldset>

      <ChoiceGroup<number>
        name="default-daily-goal"
        legend="Default daily goal"
        description="Pre-selected for new learners."
        value={defaultGoal}
        onChange={(value) => {
          setDefaultGoal(value);
          touch();
        }}
        choices={options.map((option) => ({ value: option, label: `${option} words` }))}
      />

      <div className="space-y-3">
        <Button type="submit" aria-disabled={isSaving}>
          {isSaving ? "Saving..." : "Save defaults"}
        </Button>
        <SaveStatus status={status} />
      </div>
    </form>
  );
}
