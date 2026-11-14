import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { LOCALE_COOKIE } from "@/features/i18n/locales";
import { localeRedirectPath, preferredLocale } from "@/features/i18n/preferred-locale";

export async function proxy(request: NextRequest) {
  // English public pages ("/", "/login", "/register") follow the visitor's
  // language: their saved choice, else their browser's.
  if (request.method === "GET" || request.method === "HEAD") {
    const locale = preferredLocale(
      request.cookies.get(LOCALE_COOKIE)?.value,
      request.headers.get("accept-language"),
    );
    const target = localeRedirectPath(request.nextUrl.pathname, locale);

    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = target; // keeps ?error=... from the email callback
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
