"use client";

import { registerAction } from "@/features/auth/actions/register.action";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_MAX_LENGTH } from "@/features/auth/constants";
import type { AuthErrorCode } from "@/features/auth/errors";
import type { AuthDictionary } from "@/features/i18n/auth";
import { fill, localePath, type Locale } from "@/features/i18n/locales";

const PASSWORD_MIN_LENGTH = 8;

const linkClass =
  "inline-flex min-h-11 items-center px-1 font-black underline decoration-[3px] underline-offset-4 transition-colors duration-150 hover:decoration-mark motion-reduce:transition-none";

type RegisterFormProps = {
  locale: Locale;
  dict: Pick<AuthDictionary, "form" | "errors" | "success">;
};

export function RegisterForm({ locale, dict }: RegisterFormProps) {
  const { form, errors, success: successText } = dict;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [retryEndedMessage, setRetryEndedMessage] = useState("");
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (success) successHeadingRef.current?.focus();
  }, [success]);

  useEffect(() => {
    if (retryAfter <= 0) return;

    const timeout = setTimeout(() => {
      setRetryAfter((seconds) => Math.max(0, seconds - 1));

      // Announce once when the wait is over, not on every tick.
      if (retryAfter === 1) {
        setRetryEndedMessage(form.retryEnded);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [retryAfter, form.retryEnded]);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || retryAfter > 0) return;

    // Checked here instead of maxLength: maxLength silently cuts a pasted
    // password, so the saved one would never match. Mirrors registerSchema.
    if (password.length > PASSWORD_MAX_LENGTH) {
      setError("password_too_long");
      return;
    }

    setError(null);
    setRetryEndedMessage("");
    setIsLoading(true);

    try {
      const result = await registerAction({ email, password, locale });

      if (!result.success) {
        setError(result.error);
        setRetryAfter(result.retryAfter ?? 0);
        return;
      }

      setSuccess(true);
      setPassword("");
      setRetryAfter(0);
    } catch {
      setError("unexpected");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <section
        role="status"
        className="w-full max-w-md border-[3px] border-line bg-raised p-5 text-center text-fg shadow-brutal sm:p-8"
      >
        <div className="mb-5 text-6xl" aria-hidden="true">
          ✉️
        </div>

        {/* Focus moves here: the submit button that had focus unmounts. */}
        <h2 ref={successHeadingRef} tabIndex={-1} className="text-3xl font-black uppercase focus:outline-none">
          {successText.title}
        </h2>

        {/* Same message whether or not the address is already registered,
            so this screen never reveals which emails have accounts. */}
        <p className="mt-4">
          {successText.bodyBefore}
          <strong className="break-all">{email}</strong>
          {successText.bodyAfter}
        </p>

        <p className="mt-3 text-sm font-semibold text-muted">{successText.spam}</p>

        <Link
          href={localePath(locale, "login")}
          className={buttonClasses({ variant: "secondary", className: "mt-5" })}
        >
          {successText.goToLogin}
        </Link>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-5 border-[3px] border-line bg-raised p-5 text-fg shadow-brutal sm:p-8"
    >
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
            setError(null); // the countdown, if any, stays visible
          }}
          aria-describedby={error ? "register-error" : undefined}
          placeholder={form.emailPlaceholder}
        />
      </div>

      <div>
        <Label htmlFor="password">{form.password}</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          aria-describedby={error ? "password-hint register-error" : "password-hint"}
          labels={{ show: form.showPassword, hide: form.hidePassword, suffix: form.passwordSuffix }}
        />
        {/* Visible hint: a placeholder disappears as soon as you type. */}
        <p id="password-hint" className="mt-2 text-sm font-semibold text-muted">
          {fill(form.passwordHint, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })}
        </p>
      </div>

      {error && (
        <p
          id="register-error"
          role="alert"
          className="border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box"
        >
          {fill(errors[error], { max: PASSWORD_MAX_LENGTH })}
        </p>
      )}

      {/* The countdown is shown once, on the button ("Wait 12s"). Screen
          readers get the alert above and one message when the wait ends,
          instead of a live region re-read every second. */}
      <p role="status" className="sr-only">
        {retryEndedMessage}
      </p>

      {/* aria-disabled keeps focus here; handleSubmit guards. */}
      <Button type="submit" aria-disabled={isLoading || retryAfter > 0}>
        {isLoading
          ? form.creatingAccount
          : retryAfter > 0
            ? fill(form.wait, { seconds: retryAfter })
            : form.createAccount}
      </Button>

      <p className="text-center text-sm text-muted">
        {form.haveAccount}{" "}
        <Link href={localePath(locale, "login")} className={linkClass}>
          {form.logInLink}
        </Link>
      </p>
    </form>
  );
}
