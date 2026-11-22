"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/features/auth/actions/login.action";
import type { AuthErrorCode, CallbackErrorCode } from "@/features/auth/errors";
import type { AuthDictionary } from "@/features/i18n/auth";
import { localePath, type Locale } from "@/features/i18n/locales";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

type LoginFormProps = {
  locale: Locale;
  dict: Pick<AuthDictionary, "form" | "errors">;
  // Server-validated code from the email confirmation callback, if any.
  initialError?: CallbackErrorCode | null;
};

const linkClass =
  "inline-flex min-h-11 items-center px-1 font-black underline decoration-[3px] underline-offset-4 transition-colors duration-150 hover:decoration-mark motion-reduce:transition-none";

export function LoginForm({ locale, dict, initialError = null }: LoginFormProps) {
  const router = useRouter();
  const { form, errors } = dict;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthErrorCode | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);

  // The callback error arrives as ?error=...; drop it from the URL once
  // shown, so a reload or shared link doesn't bring the alert back.
  useEffect(() => {
    if (initialError) window.history.replaceState(null, "", localePath(locale, "login"));
  }, [initialError, locale]);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await loginAction({ email, password });

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Straight to new words. Stay in the loading state while they load, so the button
      // doesn't flash back to "Log in" after a successful login.
      router.replace("/learn/new-words");
      router.refresh();
    } catch {
      setError("unexpected");
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-5 border-[3px] border-line bg-raised p-5 text-fg shadow-brutal sm:p-8"
    >
      {/* Email */}
      <div>
        <Label htmlFor="email">{form.email}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null); // a stale error shouldn't linger while fixing it
          }}
          aria-describedby={error ? "login-error" : undefined}
          placeholder={form.emailPlaceholder}
        />
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password">{form.password}</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          aria-describedby={error ? "login-error" : undefined}
          placeholder={form.passwordPlaceholder}
          labels={{ show: form.showPassword, hide: form.hidePassword, suffix: form.passwordSuffix }}
        />
      </div>

      {/* Error */}
      {error && (
        <p
          id="login-error"
          role="alert"
          className="border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box"
        >
          {errors[error]}
        </p>
      )}

      {/* Submit */}
      {/* aria-disabled keeps focus here while loading; handleSubmit guards. */}
      <Button type="submit" aria-disabled={isLoading}>
        {isLoading ? form.loggingIn : form.logIn}
      </Button>

      {/* Registration */}
      <p className="text-center text-sm text-muted">
        {form.noAccount}{" "}
        <Link href={localePath(locale, "register")} className={linkClass}>
          {form.createAccountLink}
        </Link>
      </p>
    </form>
  );
}
