"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { ChoiceGroup } from "@/components/ui/choice-group";
import { rememberLocale } from "@/features/i18n/client";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/features/i18n/locales";
import { changeTheme, onThemeChange } from "@/features/theme/client";
import type { ThemePreference } from "@/features/theme/theme";

// Theme and interface language apply at once (no Save): both live in
// cookies, like the toggles on the public pages.
export function AppearanceSettings({
  initialTheme,
  initialLocale,
}: {
  initialTheme: ThemePreference;
  initialLocale: Locale;
}) {
  const [theme, setTheme] = useState(initialTheme);
  const [locale, setLocale] = useState(initialLocale);

  // Keep in sync with the toggle in the sidebar.
  useEffect(() => onThemeChange(setTheme), []);

  return (
    <>
      <ChoiceGroup<ThemePreference>
        name="theme"
        legend="Theme"
        description="System follows your device's light or dark mode."
        value={theme}
        // The circle reveal grows from the card that was picked.
        onChange={(value) =>
          changeTheme(value, document.getElementById(`theme-${value}`)?.nextElementSibling as HTMLElement | null)
        }
        choices={[
          { value: "light", label: "Light", icon: <Sun className="h-5 w-5" strokeWidth={2.5} /> },
          { value: "dark", label: "Dark", icon: <Moon className="h-5 w-5" strokeWidth={2.5} /> },
          { value: "system", label: "System", icon: <Monitor className="h-5 w-5" strokeWidth={2.5} /> },
        ]}
      />

      <div>
        <ChoiceGroup<Locale>
          name="interface-language"
          legend="Interface language"
          description="Used on the home, log in and sign up pages. The app itself is in English for now."
          value={locale}
          onChange={(value) => {
            rememberLocale(value);
            setLocale(value);
          }}
          choices={LOCALES.map((value) => ({ value, label: LOCALE_NAMES[value], hint: value.toUpperCase(), lang: value }))}
        />
      </div>
    </>
  );
}
