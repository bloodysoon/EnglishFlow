import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { localeSchema } from "@/features/i18n/locale-schema";
import { localePath } from "@/features/i18n/locales";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  // Set by registerAction so errors show in the visitor's language.
  // Validated: only a known locale can shape the redirect path.
  const locale = localeSchema.parse(searchParams.get("locale") ?? undefined);
  const loginWithError = (error: string) =>
    new URL(`${localePath(locale, "login")}?error=${error}`, origin);

  if (!code) {
    return NextResponse.redirect(loginWithError("invalid_callback"));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Auth] Callback failed", {
      code: error.code,
      status: error.status,
    });

    return NextResponse.redirect(loginWithError("confirmation_failed"));
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}
