import type { Locale } from "@/features/i18n/locales";
import type { AuthDictionary } from "./types";
import { en } from "./en";
import { id } from "./id";
import { ro } from "./ro";
import { ru } from "./ru";

export type { AuthDictionary } from "./types";

const DICTIONARIES: Record<Locale, AuthDictionary> = { en, ru, ro, id };

export function getAuthDictionary(locale: Locale): AuthDictionary {
  return DICTIONARIES[locale];
}
