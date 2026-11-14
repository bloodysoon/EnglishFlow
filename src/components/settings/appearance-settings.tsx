"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";

import { ChoiceGroup } from "@/components/ui/choice-group";
import { rememberLocale } from "@/features/i18n/client";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { changeTheme, onThemeChange } from "@/features/theme/client";
import type { ThemePreference } from "@/features/theme/theme";

// Theme and interface language apply at once (no Save): both live in
// cookies, like the toggles on the public pages.
export function AppearanceSettings({
  initialTheme,
  initialLocale,
  t,
}: {
  initialTheme: ThemePreference;
  initialLocale: Locale;
  t: PlatformDictionary["settings"];
}) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [locale, setLocale] = useState(initialLocale);

  // Keep in sync with the toggle in the sidebar.
  useEffect(() => onThemeChange(setTheme), []);

  return (
    <>
      <ChoiceGroup<ThemePreference>
        name="theme"
        legend={t.theme}
        description={t.themeDescription}
        value={theme}
        // The circle reveal grows from the card that was picked.
        onChange={(value) =>
          changeTheme(value, document.getElementById(`theme-${value}`)?.nextElementSibling as HTMLElement | null)
        }
        choices={[
          { value: "light", label: t.light, icon: <Sun className="h-5 w-5" strokeWidth={2.5} /> },
          { value: "dark", label: t.dark, icon: <Moon className="h-5 w-5" strokeWidth={2.5} /> },
          { value: "system", label: t.system, icon: <Monitor className="h-5 w-5" strokeWidth={2.5} /> },
        ]}
      />

      <div>
        <ChoiceGroup<Locale>
          name="interface-language"
          legend={t.interfaceLanguage}
          description={t.interfaceLanguageDescription}
          value={locale}
          onChange={(value) => {
            rememberLocale(value);
            setLocale(value);
            // Server Components read the cookie: re-render them in the new language.
            router.refresh();
          }}
          choices={LOCALES.map((value) => ({ value, label: LOCALE_NAMES[value], hint: value.toUpperCase(), lang: value }))}
        />
      </div>
    </>
  );
}
