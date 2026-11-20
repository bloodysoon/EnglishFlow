"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { updateNotificationSettingsAction } from "@/features/settings/actions/update-notification-settings.action";
import { NOTIFICATION_KINDS, type NotificationPrefs } from "@/features/settings/schemas";

export function NotificationSettingsForm({
  initial,
  t,
  sessionEnded,
  unexpected,
}: {
  initial: NotificationPrefs;
  t: PlatformDictionary["settings"];
  sessionEnded: string;
  unexpected: string;
}) {
  const ERRORS = { invalid_data: t.invalidSettings, not_signed_in: sessionEnded, unexpected };
  const [saved, setSaved] = useState(initial);
  const [prefs, setPrefs] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" } | { kind: "error"; message: string } | null>(null);

  const changed = NOTIFICATION_KINDS.some((kind) => prefs[kind] !== saved[kind]);
  const labels = {
    dueWords: [t.notifyDueWords, t.notifyDueWordsHint],
    badges: [t.notifyBadges, t.notifyBadgesHint],
    milestones: [t.notifyMilestones, t.notifyMilestonesHint],
  } as const;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !changed) return;

    setIsSaving(true);
    setStatus(null);
    try {
      const result = await updateNotificationSettingsAction(prefs);
      if (result.success) {
        setSaved(prefs);
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
      <fieldset className="space-y-4">
        <legend className="sr-only">{t.notificationsTitle}</legend>
        {NOTIFICATION_KINDS.map((kind) => (
          <label key={kind} className="flex cursor-pointer items-start gap-3 font-semibold">
            <input
              type="checkbox"
              checked={prefs[kind]}
              onChange={(event) => {
                setPrefs({ ...prefs, [kind]: event.target.checked });
                setStatus(null);
              }}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-(--primary)"
            />
            <span>
              <span className="block font-black uppercase">{labels[kind][0]}</span>
              <span className="block text-sm text-muted">{labels[kind][1]}</span>
            </span>
          </label>
        ))}
      </fieldset>

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
