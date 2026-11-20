"use client";

import { useState } from "react";
import { Pin } from "lucide-react";

import { badgeIcons } from "@/components/achievements/icons";
import { Button } from "@/components/ui/button";
import type { BadgeId } from "@/features/achievements/achievements";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { updateShowcaseAction } from "@/features/profile/actions/update-showcase.action";
import { SHOWCASE_MAX } from "@/features/profile/profile";

// Pick up to SHOWCASE_MAX earned badges to show first on the profile.
export function ShowcasePicker({
  earned,
  initial,
  t,
  badgeNames,
  sessionEnded,
  unexpected,
}: {
  earned: BadgeId[];
  initial: BadgeId[];
  t: PlatformDictionary["profile"];
  badgeNames: Record<BadgeId, string>;
  sessionEnded: string;
  unexpected: string;
}) {
  const ERRORS = { invalid_data: unexpected, not_signed_in: sessionEnded, unexpected };
  const [saved, setSaved] = useState(initial.filter((id) => earned.includes(id)));
  const [pinned, setPinned] = useState(saved);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" } | { kind: "error"; message: string } | null>(null);
  const changed = pinned.join() !== saved.join();

  function toggle(id: BadgeId) {
    setStatus(null);
    if (pinned.includes(id)) return setPinned(pinned.filter((p) => p !== id));
    if (pinned.length >= SHOWCASE_MAX) {
      return setStatus({ kind: "error", message: fill(t.showcaseFull, { n: SHOWCASE_MAX }) });
    }
    setPinned([...pinned, id]);
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !changed) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const result = await updateShowcaseAction(pinned);
      if (result.success) {
        setSaved(pinned);
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

  if (earned.length === 0) return <p className="font-semibold text-muted">{t.noEarned}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ul className="flex flex-wrap gap-2">
        {earned.map((id) => {
          const Icon = badgeIcons[id];
          const on = pinned.includes(id);
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={fill(t.pin, { name: badgeNames[id] })}
                onClick={() => toggle(id)}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 border-[2px] border-line px-3 text-sm font-black uppercase shadow-brutal-sm transition-transform hover:-translate-y-0.5 motion-reduce:transition-none ${
                  on ? "bg-medal-gold text-on-box" : "bg-raised text-fg"
                }`}
              >
                {on ? <Pin className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                {badgeNames[id]}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={isSaving || !changed}>
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
