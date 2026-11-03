"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/features/auth/actions/login.action";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await loginAction({ email, password });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-5 border-[3px] border-[var(--color-ink)] bg-[var(--color-cream)] p-8 shadow-[var(--shadow-brutal)]"
    >
      {/* Email */}
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

      {/* Password */}
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border-[3px] border-[var(--color-ink)] bg-white p-3 text-[var(--color-ink)] outline-none focus:shadow-[4px_4px_0_var(--color-purple)]"
          placeholder="Your password"
        />
      </div>

      {/* Error */}
      {error && (
        <p
          role="alert"
          className="border-[3px] border-[var(--color-ink)] bg-[var(--color-pink)] p-3 font-semibold text-[var(--color-ink)]"
        >
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="border-[3px] border-[var(--color-ink)] bg-[var(--color-purple)] px-6 py-3 font-black uppercase text-white shadow-[var(--shadow-brutal)] transition-[transform,box-shadow] enabled:cursor-pointer enabled:hover:-translate-y-1 enabled:active:translate-x-1 enabled:active:translate-y-1 enabled:active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Signing in..." : "Sign in →"}
      </button>

      {/* Registration */}
      <p className="text-center text-sm text-[var(--color-ink)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-black underline">
          Create account
        </Link>
      </p>
    </form>
  );
}
