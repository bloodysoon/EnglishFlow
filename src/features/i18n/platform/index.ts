import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE, type Locale } from "@/features/i18n/locales";
import { preferredLocale } from "@/features/i18n/preferred-locale";
import { en } from "./en";
import { id } from "./id";
import { ro } from "./ro";
import { ru } from "./ru";

// Plain strings only, so slices can be passed to Client Components.
type Widen<T> = T extends string ? string : T extends object ? { [K in keyof T]: Widen<T[K]> } : T;
export type PlatformDictionary = Widen<typeof en>;

const DICTIONARIES: Record<Locale, PlatformDictionary> = { en, ru, ro, id };

export function getPlatformDictionary(locale: Locale): PlatformDictionary {
  return DICTIONARIES[locale];
}

// Server only. The interface language chosen in Settings (cookie), else the browser's.
export async function getPlatformLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return preferredLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get("accept-language"));
}

export async function getPlatformI18n(): Promise<{ locale: Locale; t: PlatformDictionary }> {
  const locale = await getPlatformLocale();
  return { locale, t: DICTIONARIES[locale] };
}

// Dates in the interface language (en-GB keeps "14 November").
export const dateLocale = (locale: Locale) => (locale === "en" ? "en-GB" : locale);
