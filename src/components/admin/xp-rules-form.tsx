"use client";

import { useState } from "react";

import { ADMIN_ERRORS, SaveStatus } from "@/components/admin/admin-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateXpRulesAction } from "@/features/admin/actions/update-xp-rules.action";
import { xpRulesSchema } from "@/features/admin/schemas";
import { CEFR_LEVELS, type CefrLevel } from "@/features/dictionary/cefr";
import { DEFAULT_XP_RULES, reviewXp, type XpRules } from "@/features/leitner/xp";

type Fields = Record<"remembered" | "forgot" | "masteredBonus" | CefrLevel, string>;

const toFields = (rules: XpRules): Fields => ({
  remembered: String(rules.remembered),
  forgot: String(rules.forgot),
  masteredBonus: String(rules.masteredBonus),
  ...(Object.fromEntries(CEFR_LEVELS.map((l) => [l, String(rules.multipliers[l])])) as Record<CefrLevel, string>),
});

const toRules = (fields: Fields): XpRules => ({
  remembered: Number(fields.remembered),
  forgot: Number(fields.forgot),
  masteredBonus: Number(fields.masteredBonus),
  multipliers: Object.fromEntries(CEFR_LEVELS.map((l) => [l, Number(fields[l])])) as Record<CefrLevel, number>,
});

function NumberField({
  id,
  label,
  hint,
  value,
  step,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step ?? "1"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="mt-1 text-xs font-semibold text-muted">
        {hint}
      </p>
    </div>
  );
}

export function XpRulesForm({ initial }: { initial: XpRules }) {
  const [fields, setFields] = useState(() => toFields(initial));
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" } | { kind: "error"; message: string } | null>(null);

  const parsed = xpRulesSchema.safeParse(toRules(fields));
  const preview = parsed.success ? parsed.data : null;

  const set = (key: keyof Fields) => (value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    if (!preview) {
      setStatus({ kind: "error", message: ADMIN_ERRORS.invalid_data });
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const result = await updateXpRulesAction(preview);
      setStatus(result.success ? { kind: "saved" } : { kind: "error", message: ADMIN_ERRORS[result.error] });
    } catch {
      setStatus({ kind: "error", message: ADMIN_ERRORS.unexpected });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <fieldset>
        <legend className="font-black uppercase">XP per answer</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <NumberField id="xp-remembered" label="Got it" hint="0–100" value={fields.remembered} onChange={set("remembered")} />
          <NumberField id="xp-forgot" label="Forgot" hint="0–100, 0 = no XP when a word drops to box 1" value={fields.forgot} onChange={set("forgot")} />
          <NumberField
            id="xp-mastered"
            label="Mastered bonus"
            hint="0–200, box 4 → 5"
            value={fields.masteredBonus}
            onChange={set("masteredBonus")}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-black uppercase">Level multipliers</legend>
        <p className="mt-1 text-sm font-semibold text-muted">0.1–5, one decimal. Words without a level count as A1.</p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CEFR_LEVELS.map((level) => (
            <NumberField
              key={level}
              id={`multiplier-${level}`}
              label={level}
              hint={`default ×${DEFAULT_XP_RULES.multipliers[level]}`}
              step="0.1"
              value={fields[level]}
              onChange={set(level)}
            />
          ))}
        </div>
      </fieldset>

      {/* What a learner would earn with these numbers. */}
      <div>
        <h3 className="font-black uppercase">Preview</h3>
        {preview ? (
          <div className="mt-3 overflow-x-auto border-[3px] border-line bg-raised">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="border-b-[3px] border-line bg-surface">
                <tr>
                  <th scope="col" className="px-3 py-2 font-black uppercase">Word level</th>
                  <th scope="col" className="px-3 py-2 font-black uppercase">Got it</th>
                  <th scope="col" className="px-3 py-2 font-black uppercase">Forgot</th>
                  <th scope="col" className="px-3 py-2 font-black uppercase">Mastered (box 4 → 5)</th>
                </tr>
              </thead>
              <tbody>
                {CEFR_LEVELS.map((level) => (
                  <tr key={level} className="border-b-2 border-line last:border-b-0">
                    <th scope="row" className="px-3 py-2 font-black">{level}</th>
                    <td className="px-3 py-2 font-semibold">+{reviewXp(1, true, level, preview).xp}</td>
                    <td className="px-3 py-2 font-semibold">+{reviewXp(1, false, level, preview).xp}</td>
                    <td className="px-3 py-2 font-semibold">+{reviewXp(4, true, level, preview).xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm font-black">Fix the values above to see the preview.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" aria-disabled={isSaving || !preview}>
          {isSaving ? "Saving..." : "Save XP rules"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setFields(toFields(DEFAULT_XP_RULES));
            setStatus(null);
          }}
        >
          Reset to defaults
        </Button>
      </div>
      <SaveStatus status={status} />
      <p className="text-sm font-semibold text-muted">
        Applies to answers from now on; XP already earned stays as it is.
      </p>
    </form>
  );
}
