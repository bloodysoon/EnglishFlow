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

  useEffect(() => {
    if (retryAfter <= 0) return;

    const timeout = setTimeout(() => {
      setRetryAfter((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [retryAfter]);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || retryAfter > 0) return;

    setError(null);
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
        className="w-full max-w-md border-[3px] border-brand-ink bg-brand-cream p-8 text-center shadow-brutal"
      >
        <div className="mb-5 text-6xl" aria-hidden="true">
          ✉️
        </div>

        <h2 className="text-3xl font-black uppercase text-brand-ink">
          Check your email!
        </h2>

        <p className="mt-4 text-brand-ink">
          If your email address is eligible for registration, you&apos;ll
          receive a confirmation link.
        </p>

        <p className="mt-3 text-sm text-brand-ink">
          Already have an account?
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
      className="flex w-full max-w-md flex-col gap-5 border-[3px] border-brand-ink bg-brand-cream p-8 shadow-brutal"
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
          placeholder="At least 8 characters"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="border-[3px] border-brand-ink bg-brand-pink p-3 font-semibold text-brand-ink"
        >
          {error}
        </p>
      )}

      {retryAfter > 0 && (
        <p role="status" className="font-bold text-brand-ink">
          ⏳ Try again in {retryAfter}s
        </p>
      )}

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
