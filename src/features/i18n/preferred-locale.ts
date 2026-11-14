import { LOCALES, localePath, type Locale, type LocalizedPage } from "./locales";

const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

// The best supported language from an Accept-Language header, e.g.
// "ro-MD,ro;q=0.9,en;q=0.8" → "ro". Null when none is supported.
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;
      return { language: tag.trim().toLowerCase().split("-")[0], quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter((item) => item.language && item.quality > 0)
    // Higher quality first; equal quality keeps the header's order.
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return ranked.map((item) => item.language).find(isLocale) ?? null;
}

// An explicit choice (cookie) wins; otherwise the browser's languages;
// otherwise English.
export function preferredLocale(cookieValue: string | undefined, acceptLanguage: string | null | undefined): Locale {
  if (cookieValue && isLocale(cookieValue)) return cookieValue;
  return localeFromAcceptLanguage(acceptLanguage) ?? "en";
}

// Unprefixed (English) public pages that have other language versions.
const ENGLISH_PAGES: Record<string, LocalizedPage> = {
  "/": "home",
  "/login": "login",
  "/register": "register",
};

// Where to send a visitor who opened an English page but prefers another
// language; null when they should stay.
export function localeRedirectPath(pathname: string, locale: Locale): string | null {
  const page = ENGLISH_PAGES[pathname];
  if (!page || locale === "en") return null;
  return localePath(locale, page);
}
