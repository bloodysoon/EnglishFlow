"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/features/auth/actions/login.action";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

type LoginFormProps = {
  // Server-validated message from the email confirmation callback, if any.
  initialError?: string | null;
};

export function LoginForm({ initialError = null }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
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
      className="flex w-full max-w-md flex-col gap-5 border-[3px] border-brand-ink bg-brand-cream p-5 shadow-brutal sm:p-8"
    >
      {/* Email */}
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
            setError(null); // a stale error shouldn't linger while fixing it
          }}
          aria-describedby={error ? "login-error" : undefined}
          placeholder="you@example.com"
        />
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password">Password</Label>
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
          placeholder="Your password"
        />
      </div>

      {/* Error */}
      {error && (
        <p
          id="login-error"
          role="alert"
          className="border-[3px] border-brand-ink bg-brand-pink p-3 font-semibold text-brand-ink"
        >
          {error}
        </p>
      )}

      {/* Submit */}
      {/* aria-disabled keeps focus here while loading; handleSubmit guards. */}
      <Button type="submit" aria-disabled={isLoading}>
        {isLoading ? "Logging in..." : "Log in →"}
      </Button>

      {/* Registration */}
      <p className="text-center text-sm text-brand-ink">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="inline-flex min-h-11 items-center px-1 font-black underline underline-offset-4">
          Create account
        </Link>
      </p>
    </form>
  );
}
