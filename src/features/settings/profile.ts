import { createClient } from "@/lib/supabase/server";
import { getAppSettings, type AppSettings } from "./app-settings";
import { learningSettingsSchema, type LearningSettings } from "./schemas";

// Server only. The learner's saved settings plus the app-wide options
// (goal choices, defaults) from the admin panel. Before the learner saves
// anything their row already holds the defaults (column defaults read
// app_settings); a missing row falls back to the defaults as well.
export async function getLearningSettings(): Promise<{ settings: LearningSettings; app: AppSettings }> {
  const supabase = await createClient();
  const app = await getAppSettings(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase.from("profiles").select("translation_language, daily_goal").eq("id", user.id).maybeSingle()
    : { data: null };

  const saved = learningSettingsSchema.safeParse({
    translationLanguage: data?.translation_language,
    dailyGoal: data?.daily_goal,
  });

  return {
    settings: saved.success
      ? saved.data
      : { translationLanguage: app.defaultTranslationLanguage, dailyGoal: app.defaultDailyGoal },
    app,
  };
}
