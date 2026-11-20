"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";

import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { applyAccent } from "@/features/rewards/accent-client";
import { ACCENTS, type AccentId } from "@/features/rewards/levels";

// Accent colours unlock with the learner level. Applied at once (no Save),
// stored in a cookie like the theme.
export function AccentPicker({
  initial,
  level,
  t,
}: {
  initial: AccentId;
  level: number;
  t: PlatformDictionary["rewards"];
}) {
  const [accent, setAccent] = useState(initial);

  function choose(id: AccentId) {
    setAccent(id);
    applyAccent(id);
  }

  return (
    <fieldset aria-describedby="accent-description">
      <legend className="font-black uppercase">{t.accentTitle}</legend>
      <p id="accent-description" className="mt-1 text-sm font-semibold text-muted">
        {t.accentDescription}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACCENTS.map(({ id, level: unlockAt }) => {
          const locked = level < unlockAt;
          const checked = accent === id;
          return (
            <label
              key={id}
              // data-swatch scopes --primary to this colour (globals.css).
              data-swatch={id}
              className={`flex min-h-14 items-center gap-3 border-[3px] p-3 font-black ${
                locked
                  ? "cursor-not-allowed border-dashed border-line/60 text-muted"
                  : `cursor-pointer border-line bg-raised shadow-brutal-sm has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary ${
                      checked ? "bg-chip text-on-box" : "hover:-translate-y-0.5"
                    }`
              }`}
            >
              <input
                type="radio"
                name="accent"
                value={id}
                checked={checked}
                disabled={locked}
                onChange={() => choose(id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-line bg-primary text-on-primary"
              >
                {checked && <Check className="h-4 w-4" strokeWidth={3} />}
                {locked && <Lock className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-tight uppercase">{t.accents[id]}</span>
                {locked && (
                  <span className="block text-xs font-bold">{fill(t.unlocksAt, { level: unlockAt })}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
