import { cookies } from "next/headers";

import { THEME_COOKIE, parseThemePreference, type ThemePreference } from "./theme";

// Server only (next/headers). The visitor's saved theme, read on the
// server so the first paint is already right (no flash). Falls back to
// "system".
export async function getThemePreference(): Promise<ThemePreference> {
  return parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
}
