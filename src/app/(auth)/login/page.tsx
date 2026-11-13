import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/features/components/login-form";
import { getCallbackErrorMessage } from "@/features/auth/lib/callback-error";
import { LogoLink } from "@/components/ui/logo-link";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already logged in? Go to dashboard.
  if (user) {
    redirect("/dashboard");
  }

  const callbackError = getCallbackErrorMessage((await searchParams).error);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 overflow-x-clip bg-brand-orange px-4 py-10 sm:px-6 sm:py-14">
      <LogoLink />

      <header className="flex w-full max-w-3xl flex-col items-center gap-5 text-center">
        <span className="brutal-sticker text-xs sm:text-sm">
          Welcome back to EnglishFlow
          <span className="brutal-sticker__icon" aria-hidden="true">
            ✳
          </span>
        </span>

        <h1 className="flex w-full flex-col items-center gap-3 text-[clamp(1.5rem,6.5vw,4.5rem)] leading-none font-black tracking-tight uppercase text-brand-ink">
          <span className="whitespace-nowrap">Back for more?</span>
          <span className="brutal-lift">Let&apos;s keep going.</span>
        </h1>

        <p className="max-w-md text-base leading-relaxed font-bold text-brand-ink sm:text-lg">
          Every word brings you closer.{" "}
          <span className="brutal-highlight">
            Pick up where you left off.
            <span className="brutal-highlight__bolt" aria-hidden="true">
              ⚡
            </span>
          </span>
        </p>
      </header>

      <LoginForm initialError={callbackError} />
    </main>
  );
}
