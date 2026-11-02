"use client";

import { registerAction } from "@/features/auth/actions/register.action";
import { useEffect, useState } from "react";
import Link from "next/link";

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
        className="w-full max-w-md border-[3px] border-[var(--color-ink)] bg-[var(--color-cream)] p-8 text-center shadow-[var(--shadow-brutal)]"
      >
        <div className="mb-5 text-6xl" aria-hidden="true">
          ✉️
        </div>

        <h2 className="text-3xl font-black uppercase text-[var(--color-ink)]">
          Check your email!
        </h2>

        <p className="mt-4 text-[var(--color-ink)]">
          If your email address is eligible for registration, you&apos;ll
          receive a confirmation link.
        </p>

        <p className="mt-3 text-sm text-[var(--color-ink)]">
          Already have an account?
        </p>

        <Link
          href="/login"
          className="mt-5 inline-block border-[3px] border-[var(--color-ink)] bg-[var(--color-green)] px-6 py-3 font-black uppercase text-[var(--color-ink)] shadow-[var(--shadow-brutal)] transition-transform hover:-translate-y-1"
        >
          Go to login →
        </Link>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-5 border-[3px] border-[var(--color-ink)] bg-[var(--color-cream)] p-8 shadow-[var(--shadow-brutal)]"
    >
      <div>
        <label
          htmlFor="email"
          className="mb-2 block font-black uppercase text-[var(--color-ink)]"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full border-[3px] border-[var(--color-ink)] bg-white p-3 text-[var(--color-ink)] outline-none focus:shadow-[4px_4px_0_var(--color-purple)]"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block font-black uppercase text-[var(--color-ink)]"
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border-[3px] border-[var(--color-ink)] bg-white p-3 text-[var(--color-ink)] outline-none focus:shadow-[4px_4px_0_var(--color-purple)]"
          placeholder="At least 8 characters"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="border-[3px] border-[var(--color-ink)] bg-[var(--color-pink)] p-3 font-semibold text-[var(--color-ink)]"
        >
          {error}
        </p>
      )}

      {retryAfter > 0 && (
        <p role="status" className="font-bold text-[var(--color-ink)]">
          ⏳ Try again in {retryAfter}s
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || retryAfter > 0}
        className="border-[3px] border-[var(--color-ink)] bg-[var(--color-purple)] px-6 py-3 font-black uppercase text-white shadow-[var(--shadow-brutal)] transition-[transform,box-shadow] enabled:cursor-pointer enabled:hover:-translate-y-1 enabled:active:translate-x-1 enabled:active:translate-y-1 enabled:active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? "Creating account..."
          : retryAfter > 0
            ? `Wait ${retryAfter}s`
            : "Create account →"}
      </button>

      <p className="text-center text-sm text-[var(--color-ink)]">
        Already have an account?{" "}
        <Link href="/login" className="font-black underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
