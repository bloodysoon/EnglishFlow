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
import { PASSWORD_MIN_LENGTH } from "@/features/settings/schemas";

const ERRORS: Record<ChangePasswordError, string> = {
  invalid_data: `The new password must be ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters.`,
  same_password: "The new password must be different from the current one.",
  wrong_current_password: "Your current password is not correct.",
  weak_password: "That password is too easy to guess. Try a longer one.",
  rate_limited: "Too many attempts. Please wait a minute and try again.",
  not_signed_in: "Your session has ended. Please log in again.",
  unexpected: "Something went wrong. Please try again.",
};

export function ChangePasswordForm({ email }: { email: string }) {
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
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" type="email" autoComplete="username" value={email} readOnly className="bg-surface" />
      </div>

      <div>
        <Label htmlFor="current-password">Current password</Label>
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
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
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
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
          {PASSWORD_MIN_LENGTH} to {PASSWORD_MAX_LENGTH} characters.
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
          {isSaving ? "Changing..." : "Change password"}
        </Button>
        <p role="status" className="text-sm font-black">
          {done && "Password changed ✓"}
        </p>
      </div>
    </form>
  );
}
