import type { SupabaseClient } from "@supabase/supabase-js";

import { appSettingsSchema, type AppSettingsInput } from "@/features/admin/schemas";

export type AppSettings = AppSettingsInput;

// Matches the defaults of public.app_settings; used if the row is
// missing or unreadable, so the app never breaks over settings.
export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultTranslationLanguage: "ru",
  defaultDailyGoal: 10,
  dailyGoalOptions: [5, 10, 20],
};

type AppSettingsRow = {
  default_translation_language?: unknown;
  default_daily_goal?: unknown;
  daily_goal_options?: unknown;
};

export function appSettingsFromRow(row: AppSettingsRow | null | undefined): AppSettings {
  const parsed = appSettingsSchema.safeParse({
    defaultTranslationLanguage: row?.default_translation_language,
    defaultDailyGoal: row?.default_daily_goal,
    dailyGoalOptions: Array.isArray(row?.daily_goal_options)
      ? [...row.daily_goal_options].map(Number).sort((a, b) => a - b)
      : undefined,
  });
  return parsed.success ? parsed.data : DEFAULT_APP_SETTINGS;
}

export async function getAppSettings(supabase: SupabaseClient): Promise<AppSettings> {
  const { data } = await supabase
    .from("app_settings")
    .select("default_translation_language, default_daily_goal, daily_goal_options")
    .eq("id", true)
    .maybeSingle();
  return appSettingsFromRow(data);
}
