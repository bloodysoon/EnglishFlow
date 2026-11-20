"use client";

import { useState, type ReactNode } from "react";
import { Check, Lock } from "lucide-react";

import { medalStyles } from "@/components/achievements/medals";
import { Button } from "@/components/ui/button";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { equipAction } from "@/features/rewards/actions/equip.action";
import {
  FRAME_LEVELS,
  frameUnlocked,
  LEVEL_TITLES,
  MEDALS,
  titleUnlocked,
  type Equipped,
} from "@/features/rewards/levels";

type Labels = {
  inventory: PlatformDictionary["inventory"];
  rewards: PlatformDictionary["rewards"];
  medals: PlatformDictionary["achievements"]["medals"];
  sessionEnded: string;
  unexpected: string;
};

// One radio drawn as a brutal card; locked ones show the level they open at.
function Option({
  name,
  checked,
  locked,
  onChange,
  label,
  hint,
  swatch,
}: {
  name: string;
  checked: boolean;
  locked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  swatch?: ReactNode;
}) {
  return (
    <label
      className={`flex min-h-12 items-center gap-2.5 border-[3px] p-2.5 text-sm font-black ${
        locked
          ? "cursor-not-allowed border-dashed border-line/60 text-muted"
          : `cursor-pointer border-line shadow-brutal-sm has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary ${
              checked ? "bg-chip text-on-box" : "bg-raised hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            }`
      }`}
    >
      <input type="radio" name={name} checked={checked} disabled={locked} onChange={onChange} className="sr-only" />
      {swatch}
      <span className="min-w-0 flex-1">
        <span className="block leading-tight uppercase">{label}</span>
        {hint && <span className="block text-xs font-bold">{hint}</span>}
      </span>
      {locked ? (
        <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        checked && <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
      )}
    </label>
  );
}

// Pick the title and avatar frame the profile shows.
export function EquipForm({ initial, level, labels }: { initial: Equipped; level: number; labels: Labels }) {
  const t = labels.inventory;
  const ERRORS = { invalid_data: labels.unexpected, locked: t.locked, not_signed_in: labels.sessionEnded, unexpected: labels.unexpected };
  const [saved, setSaved] = useState(initial);
  const [title, setTitle] = useState(initial.title);
  const [frame, setFrame] = useState(initial.frame);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" } | { kind: "error"; message: string } | null>(null);
  const changed = title !== saved.title || frame !== saved.frame;
  const levelHint = (n: number) => fill(labels.rewards.unlocksAt, { level: n });

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !changed) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const result = await equipAction({ title, frame });
      if (result.success) {
        setSaved({ title, frame });
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

  const pickTitle = (value: Equipped["title"]) => {
    setTitle(value);
    setStatus(null);
  };
  const pickFrame = (value: Equipped["frame"]) => {
    setFrame(value);
    setStatus(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <fieldset>
        <legend className="font-black uppercase">{t.titleLabel}</legend>
        <div className="mt-3 grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2 lg:grid-cols-4">
          <Option
            name="title"
            checked={title === null}
            locked={false}
            onChange={() => pickTitle(null)}
            label={t.followLevel}
            hint={t.followLevelHint}
          />
          {LEVEL_TITLES.map(({ id, from }) => {
            const locked = !titleUnlocked(id, level);
            return (
              <Option
                key={id}
                name="title"
                checked={title === id}
                locked={locked}
                onChange={() => pickTitle(id)}
                label={labels.rewards.titles[id]}
                hint={levelHint(from)}
              />
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-black uppercase">{t.frameLabel}</legend>
        <div className="mt-3 grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2 lg:grid-cols-4">
          <Option
            name="frame"
            checked={frame === null}
            locked={false}
            onChange={() => pickFrame(null)}
            label={t.followLevel}
            hint={t.followLevelHint}
          />
          <Option
            name="frame"
            checked={frame === "none"}
            locked={false}
            onChange={() => pickFrame("none")}
            label={t.frameNone}
          />
          {MEDALS.map((medal) => (
            <Option
              key={medal}
              name="frame"
              checked={frame === medal}
              locked={!frameUnlocked(medal, level)}
              onChange={() => pickFrame(medal)}
              label={labels.medals[medal]}
              hint={levelHint(FRAME_LEVELS[medal])}
              swatch={
                <span aria-hidden="true" className={`h-7 w-7 shrink-0 border-[2px] border-line ${medalStyles[medal]}`} />
              }
            />
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" aria-disabled={isSaving || !changed}>
          {isSaving ? t.saving : t.save}
        </Button>
        <p role="status" className="text-sm font-bold">
          {status?.kind === "saved" && t.saved}
          {status?.kind === "error" && <span className="text-mark">{status.message}</span>}
        </p>
      </div>
    </form>
  );
}
