import type { Locale } from "@/features/i18n/locales";
import type { LandingDictionary } from "./types";
import { en } from "./en";
import { id } from "./id";
import { ro } from "./ro";
import { ru } from "./ru";

export type { LandingDictionary } from "./types";

const DICTIONARIES: Record<Locale, LandingDictionary> = { en, ru, ro, id };

export function getLandingDictionary(locale: Locale): LandingDictionary {
  return DICTIONARIES[locale];
}
