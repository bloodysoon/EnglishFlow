// Interface languages of the public pages (landing, log in, register).
// English has no prefix ("/login"); the others do ("/ru/login").
export const LOCALES = ["en", "ru", "ro"] as const;

export type Locale = (typeof LOCALES)[number];

// The visitor's chosen interface language (set by the language switcher).
export const LOCALE_COOKIE = "ef-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type LocalizedPage = "home" | "login" | "register";

const PAGE_PATHS: Record<LocalizedPage, string> = {
  home: "",
  login: "/login",
  register: "/register",
};

export function localePath(locale: Locale, page: LocalizedPage): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${prefix}${PAGE_PATHS[page]}` || "/";
}

// The same page in every language (language switcher, hreflang links).
export function localePaths(page: LocalizedPage): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, localePath(l, page)])) as Record<Locale, string>;
}

export const LOCALE_PATHS: Record<Locale, string> = localePaths("home");

// Each language named in itself, as the switcher shows it.
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  ro: "Română",
};

// The languages we translate English words into (the learners' languages).
export type TranslationLanguage = Exclude<Locale, "en">;

// Fills "{name}" placeholders. Dictionaries hold plain strings (not
// functions) so they can be passed to Client Components.
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
