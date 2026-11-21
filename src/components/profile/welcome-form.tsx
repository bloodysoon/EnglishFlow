"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { updateProfileAction } from "@/features/profile/actions/update-profile.action";
import { usernameSchema } from "@/features/profile/profile";

// The nickname step on /welcome. Saves through the profile action (public
// profile stays off), then opens the dashboard.
export function WelcomeForm({
  t,
  profile,
  sessionEnded,
  unexpected,
}: {
  t: PlatformDictionary["welcome"];
  profile: PlatformDictionary["profile"];
  sessionEnded: string;
  unexpected: string;
}) {
  const ERRORS = { invalid_data: profile.invalidUsername, taken: profile.taken, not_signed_in: sessionEnded, unexpected };
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = usernameSchema.safeParse(username).success;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    if (!valid) {
      setError(profile.invalidUsername);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const result = await updateProfileAction({ username, isPublic: false });
      if (result.success) {
        router.replace("/dashboard");
        return; // stay "saving" while the dashboard loads
      }
      setError(ERRORS[result.error]);
    } catch {
      setError(unexpected);
    }
    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <Label htmlFor="username">{profile.username}</Label>
        <div className="flex items-stretch">
          <span aria-hidden="true" className="flex items-center border-[3px] border-r-0 border-line bg-canvas px-3 font-black text-muted">
            @
          </span>
          <Input
            id="username"
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby="username-hint username-error"
          />
        </div>
        <p id="username-hint" className="mt-1 text-xs font-semibold text-muted">
          {profile.usernameHint}
        </p>
        <p id="username-error" role="alert" className="mt-2 min-h-5 text-sm font-bold text-mark">
          {error}
        </p>
      </div>

      <Button type="submit" disabled={isSaving} className="w-full">
        {isSaving ? t.saving : t.cta}
      </Button>
    </form>
  );
}
