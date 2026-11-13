"use client";

import { registerAction } from "@/features/auth/actions/register.action";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_MAX_LENGTH } from "@/features/auth/constants";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
        setRetryEndedMessage("You can try again now.");
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [retryAfter]);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || retryAfter > 0) return;

    // Checked here instead of maxLength: maxLength silently cuts a pasted
    // password, so the saved one would never match. Mirrors registerSchema.
    if (password.length > PASSWORD_MAX_LENGTH) {
      setError(`Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`);
      return;
    }

    setError(null);
    setRetryEndedMessage("");
    setIsLoading(true);

    try {
      const result = await registerAction({ email, password });

      if (!result.success) {
        setError(result.error);
        setRetryAfter(result.retryAfter ?? 0);
        return;
      }

      setSuccess(true);
      setPassword("");
      setRetryAfter(0);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <section
        role="status"
        className="w-full max-w-md border-[3px] border-brand-ink bg-brand-cream p-5 text-center shadow-brutal sm:p-8"
      >
        <div className="mb-5 text-6xl" aria-hidden="true">
          ✉️
        </div>

        {/* Focus moves here: the submit button that had focus unmounts. */}
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="text-3xl font-black uppercase text-brand-ink focus:outline-none"
        >
          Check your inbox!
        </h2>

        {/* Same message whether or not the address is already registered,
            so this screen never reveals which emails have accounts. */}
        <p className="mt-4 text-brand-ink">
          If this address can be used, a confirmation link is on its way to{" "}
          <strong className="break-all">{email}</strong>. Open it to activate
          your account.
        </p>

        <p className="mt-3 text-sm font-semibold text-brand-ink">
          Nothing after a few minutes? Check your spam folder. Already have an
          account? Just log in.
        </p>

        <Link
          href="/login"
          className={buttonClasses({ variant: "secondary", className: "mt-5" })}
        >
          Go to login →
        </Link>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-5 border-[3px] border-brand-ink bg-brand-cream p-5 shadow-brutal sm:p-8"
    >
      <div>
        <Label htmlFor="email">Email</Label>
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
          placeholder="you@example.com"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          aria-describedby={
            error ? "password-hint register-error" : "password-hint"
          }
        />
        {/* Visible hint: a placeholder disappears as soon as you type. */}
        <p id="password-hint" className="mt-2 text-sm font-semibold text-brand-ink">
          8 to {PASSWORD_MAX_LENGTH} characters.
        </p>
      </div>

      {error && (
        <p
          id="register-error"
          role="alert"
          className="border-[3px] border-brand-ink bg-brand-pink p-3 font-semibold text-brand-ink"
        >
          {error}
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
          ? "Creating account..."
          : retryAfter > 0
            ? `Wait ${retryAfter}s`
            : "Create account →"}
      </Button>

      <p className="text-center text-sm text-brand-ink">
        Already have an account?{" "}
        <Link href="/login" className="inline-flex min-h-11 items-center px-1 font-black underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
