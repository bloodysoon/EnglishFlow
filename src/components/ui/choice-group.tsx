"use client";

import type { ReactNode } from "react";

export type Choice<T extends string | number> = {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
  // Language of the label and hint, when it differs from the page's
  // (picks the right font and voice, e.g. "Русский" on an English page).
  lang?: string;
};

type ChoiceGroupProps<T extends string | number> = {
  name: string;
  legend: string;
  description?: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  // Grid columns from sm up, e.g. "sm:grid-cols-3".
  columns?: string;
};

// A set of radio buttons drawn as brutal cards. Native radios underneath,
// so arrow keys, Tab and screen readers work as expected.
export function ChoiceGroup<T extends string | number>({
  name,
  legend,
  description,
  choices,
  value,
  onChange,
  columns = "sm:grid-cols-3",
}: ChoiceGroupProps<T>) {
  const descriptionId = description ? `${name}-description` : undefined;

  return (
    <fieldset aria-describedby={descriptionId}>
      <legend className="font-black uppercase">{legend}</legend>
      {description && (
        <p id={descriptionId} className="mt-1 text-sm font-semibold text-muted">
          {description}
        </p>
      )}

      <div className={`mt-3 grid gap-3 ${columns}`}>
        {choices.map((choice) => (
          <label key={String(choice.value)} className="group relative block cursor-pointer">
            <input
              id={`${name}-${choice.value}`}
              type="radio"
              name={name}
              value={String(choice.value)}
              checked={choice.value === value}
              onChange={() => onChange(choice.value)}
              className="peer sr-only"
            />
            <span
              className="
                flex min-h-14 items-center gap-3 border-[3px] border-line bg-raised px-4 py-3 text-fg
                shadow-brutal-sm transition-[transform,box-shadow,background-color] duration-150
                group-hover:-translate-y-0.5 group-hover:shadow-brutal-md
                peer-checked:bg-chip peer-checked:text-on-box peer-checked:shadow-brutal-md
                peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-fg
                motion-reduce:transition-none
              "
            >
              {choice.icon && <span aria-hidden="true" className="shrink-0">{choice.icon}</span>}
              <span className="min-w-0" lang={choice.lang}>
                <span className="block font-black">{choice.label}</span>
                {choice.hint && <span className="block text-xs font-semibold opacity-80">{choice.hint}</span>}
              </span>
              <span
                aria-hidden="true"
                className="ml-auto h-4 w-4 shrink-0 rounded-full border-[3px] border-line bg-raised group-has-checked:bg-line"
              />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
