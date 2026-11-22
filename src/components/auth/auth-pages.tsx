import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { parseCallbackError } from "@/features/auth/lib/callback-error";
import { LoginForm } from "@/features/components/login-form";
import { RegisterForm } from "@/features/components/register-form";
import { getAuthDictionary } from "@/features/i18n/auth";
import { localePath, localePaths, type Locale } from "@/features/i18n/locales";
import { createClient } from "@/lib/supabase/server";

type AuthPage = "login" | "register";
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Localized title ("Вход · Elevo" via the root template) plus hreflang
// links between the three versions of the page.
export function authMetadata(locale: Locale, page: AuthPage): Metadata {
  const { meta } = getAuthDictionary(locale);
  const paths = localePaths(page);

  return {
    title: page === "login" ? meta.loginTitle : meta.registerTitle,
    alternates: {
      canonical: localePath(locale, page),
      languages: { ...paths, "x-default": paths.en },
    },
  };
}

// Already logged in? Go where logging in goes: new words.
async function redirectIfSignedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/learn/new-words");
}

function Lead({ text, highlight }: { text: string; highlight: string }) {
  return (
    <>
      {text}{" "}
      <span className="brutal-highlight font-black whitespace-normal text-fg">{highlight}</span>
    </>
  );
}

export async function LoginPage({ locale, searchParams }: { locale: Locale; searchParams: SearchParams }) {
  await redirectIfSignedIn();

  const dict = getAuthDictionary(locale);
  const callbackError = parseCallbackError((await searchParams).error);

  return (
    <AuthShell
      locale={locale}
      page="login"
      sticker={dict.login.sticker}
      titleLine1={dict.login.titleLine1}
      titleLine2={dict.login.titleLine2}
      lead={<Lead text={dict.login.lead} highlight={dict.login.leadHighlight} />}
    >
      <LoginForm locale={locale} dict={{ form: dict.form, errors: dict.errors }} initialError={callbackError} />
    </AuthShell>
  );
}

export async function RegisterPage({ locale }: { locale: Locale }) {
  await redirectIfSignedIn();

  const dict = getAuthDictionary(locale);

  return (
    <AuthShell
      locale={locale}
      page="register"
      sticker={dict.register.sticker}
      titleLine1={dict.register.titleLine1}
      titleLine2={dict.register.titleLine2}
      lead={<Lead text={dict.register.lead} highlight={dict.register.leadHighlight} />}
    >
      <RegisterForm locale={locale} dict={{ form: dict.form, errors: dict.errors, success: dict.success }} />
    </AuthShell>
  );
}
