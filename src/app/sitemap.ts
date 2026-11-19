import type { MetadataRoute } from "next";

import { LOCALES, LOCALE_PATHS } from "@/features/i18n/locales";
import { SITE_URL } from "@/lib/site-url";

// The landing in each language, each entry listing its translations.
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    LOCALES.map((locale) => [locale, new URL(LOCALE_PATHS[locale], SITE_URL).href]),
  );

  return LOCALES.map((locale) => ({
    url: languages[locale],
    alternates: { languages },
  }));
}
