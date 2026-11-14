import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "./locales";

// Browser only. Remembers the interface language so English-only entry
// points ("/", "/login", "/register", e.g. after logging out) open in it
// next time (src/proxy.ts).
export function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}
