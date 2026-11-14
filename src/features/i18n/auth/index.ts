import type { Locale } from "@/features/i18n/locales";
import type { AuthDictionary } from "./types";
import { en } from "./en";
import { ro } from "./ro";
import { ru } from "./ru";

export type { AuthDictionary } from "./types";

const DICTIONARIES: Record<Locale, AuthDictionary> = { en, ru, ro };

export function getAuthDictionary(locale: Locale): AuthDictionary {
  return DICTIONARIES[locale];
}
