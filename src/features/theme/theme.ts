import { z } from "zod";

// The visitor's colour theme choice. "system" follows the OS setting via
// prefers-color-scheme; the toggle stores an explicit "light" or "dark".
export const THEME_COOKIE = "ef-theme";

// One year: the choice should survive between visits.
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const themePreferenceSchema = z
  .enum(["light", "dark", "system"])
  .catch("system");

export type ThemePreference = z.infer<typeof themePreferenceSchema>;
export type ResolvedTheme = Exclude<ThemePreference, "system">;

// Cookies are untrusted input: anything unexpected falls back to "system".
export function parseThemePreference(value: unknown): ThemePreference {
  return themePreferenceSchema.parse(value);
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}
