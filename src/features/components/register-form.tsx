"use client";

import { registerAction } from "@/features/auth/actions/register.action";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [retryEndedMessage, setRetryEndedMessage] = useState("");

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

        <h2 className="text-3xl font-black uppercase text-brand-ink">
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
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={error ? "register-error" : undefined}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby={
            error ? "password-hint register-error" : "password-hint"
          }
        />
        {/* Visible hint: a placeholder disappears as soon as you type. */}
        <p id="password-hint" className="mt-2 text-sm font-semibold text-brand-ink">
          At least 8 characters.
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

      {/* Visual countdown only: a live region here would be re-read every
          second. Screen readers get the alert above and the message below. */}
      {retryAfter > 0 && (
        <p className="font-bold text-brand-ink" aria-hidden="true">
          ⏳ Try again in {retryAfter}s
        </p>
      )}

      <p role="status" className="sr-only">
        {retryEndedMessage}
      </p>

      <Button type="submit" disabled={isLoading || retryAfter > 0}>
        {isLoading
          ? "Creating account..."
          : retryAfter > 0
            ? `Wait ${retryAfter}s`
            : "Create account →"}
      </Button>

      <p className="text-center text-sm text-brand-ink">
        Already have an account?{" "}
        <Link href="/login" className="font-black underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
