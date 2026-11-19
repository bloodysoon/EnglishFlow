"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { updateProfileAction } from "@/features/profile/actions/update-profile.action";
import { usernameSchema, type ProfileSettings } from "@/features/profile/profile";

export function ProfileForm({
  initial,
  t,
  sessionEnded,
  unexpected,
}: {
  initial: { username: string | null; isPublic: boolean };
  t: PlatformDictionary["profile"];
  sessionEnded: string;
  unexpected: string;
}) {
  const ERRORS = { invalid_data: t.invalidUsername, taken: t.taken, not_signed_in: sessionEnded, unexpected };
  const [saved, setSaved] = useState(initial);
  const [username, setUsername] = useState(initial.username ?? "");
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" } | { kind: "error"; message: string } | null>(null);

  const valid = usernameSchema.safeParse(username).success;
  const changed = username.trim().toLowerCase() !== (saved.username ?? "") || isPublic !== saved.isPublic;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !changed) return;
    if (!valid) {
      setStatus({ kind: "error", message: t.invalidUsername });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      const next: ProfileSettings = { username, isPublic };
      const result = await updateProfileAction(next);
      if (result.success) {
        setUsername(result.username);
        setSaved({ username: result.username, isPublic });
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="max-w-sm">
        <Label htmlFor="username">{t.username}</Label>
        <div className="flex items-stretch">
          <span aria-hidden="true" className="flex items-center border-[3px] border-r-0 border-line bg-canvas px-3 font-black text-muted">
            @
          </span>
          <Input
            id="username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setStatus(null);
            }}
            aria-invalid={username !== "" && !valid ? true : undefined}
            aria-describedby="username-hint"
          />
        </div>
        <p id="username-hint" className="mt-1 text-xs font-semibold text-muted">
          {t.usernameHint}
        </p>
      </div>

      <label className="flex max-w-xl cursor-pointer items-start gap-3 font-semibold">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => {
            setIsPublic(event.target.checked);
            setStatus(null);
          }}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-(--primary)"
        />
        <span>
          <span className="block font-black uppercase">{t.makePublic}</span>
          <span className="block text-sm text-muted">{t.makePublicHint}</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={isSaving || !changed}>
          {isSaving ? t.saving : t.save}
        </Button>
        <p role="status" className="text-sm font-bold">
          {status?.kind === "saved" && t.saved}
          {status?.kind === "error" && <span className="text-mark">{status.message}</span>}
        </p>
      </div>

      {saved.isPublic && saved.username && (
        <p className="text-sm font-semibold">
          {t.yourLink}{" "}
          <Link
            href={`/u/${saved.username}`}
            className="font-black break-all underline decoration-2 underline-offset-2 hover:decoration-mark"
          >
            /u/{saved.username}
          </Link>
        </p>
      )}
    </form>
  );
}
