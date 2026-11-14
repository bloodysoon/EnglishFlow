"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_MAX_LENGTH } from "@/features/auth/constants";
import {
  changePasswordAction,
  type ChangePasswordError,
} from "@/features/settings/actions/change-password.action";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { PASSWORD_MIN_LENGTH } from "@/features/settings/schemas";

const LENGTHS = { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH };

export function ChangePasswordForm({
  email,
  t,
  sessionEnded,
  unexpected,
  passwordToggle,
}: {
  email: string;
  passwordToggle: { show: string; hide: string; suffix: string };
  t: PlatformDictionary["settings"];
  sessionEnded: string;
  unexpected: string;
}) {
  const ERRORS: Record<ChangePasswordError, string> = {
    ...t.passwordErrors,
    invalid_data: fill(t.passwordErrors.invalid_data, LENGTHS),
    not_signed_in: sessionEnded,
    unexpected,
  };
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<ChangePasswordError | null>(null);
  const [done, setDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    // Same rule as the server, checked here for a quicker answer.
    if (newPassword.length > PASSWORD_MAX_LENGTH) {
      setError("invalid_data");
      return;
    }

    setIsSaving(true);
    setError(null);
    setDone(false);
    try {
      const result = await changePasswordAction({ currentPassword, newPassword });
      if (result.success) {
        setCurrentPassword("");
        setNewPassword("");
        setDone(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError("unexpected");
    } finally {
      setIsSaving(false);
    }
  }

  const describedBy = (hint?: string) => [hint, error ? "password-error" : null].filter(Boolean).join(" ") || undefined;

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-5">
      {/* Read-only, but tells password managers which account this is. */}
      <div>
        <Label htmlFor="account-email">{t.email}</Label>
        <Input id="account-email" type="email" autoComplete="username" value={email} readOnly className="bg-surface" />
      </div>

      <div>
        <Label htmlFor="current-password">{t.currentPassword}</Label>
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
          labels={passwordToggle}
          required
          value={currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.target.value);
            setError(null);
            setDone(false);
          }}
          aria-describedby={describedBy()}
        />
      </div>

      <div>
        <Label htmlFor="new-password">{t.newPassword}</Label>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          labels={passwordToggle}
          minLength={PASSWORD_MIN_LENGTH}
          required
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setError(null);
            setDone(false);
          }}
          aria-describedby={describedBy("new-password-hint")}
        />
        <p id="new-password-hint" className="mt-2 text-sm font-semibold text-muted">
          {fill(t.passwordHint, LENGTHS)}
        </p>
      </div>

      {error && (
        <p id="password-error" role="alert" className="border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
          {ERRORS[error]}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* aria-disabled keeps focus here; handleSubmit guards. */}
        <Button type="submit" aria-disabled={isSaving}>
          {isSaving ? t.changing : t.changePassword}
        </Button>
        <p role="status" className="text-sm font-black">
          {done && t.passwordChanged}
        </p>
      </div>
    </form>
  );
}
