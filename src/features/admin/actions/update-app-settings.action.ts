"use server";

import { revalidatePath } from "next/cache";

import { appSettingsSchema } from "../schemas";
import { getAdmin } from "../server";
import type { AdminActionResult } from "./result";

export async function updateAppSettingsAction(input: unknown): Promise<AdminActionResult> {
  const parsed = appSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const admin = await getAdmin();
  if (!admin) return { success: false, error: "forbidden" };

  const options = [...parsed.data.dailyGoalOptions].sort((a, b) => a - b);
  const { data, error } = await admin.supabase
    .from("app_settings")
    .update({
      default_translation_language: parsed.data.defaultTranslationLanguage,
      default_daily_goal: parsed.data.defaultDailyGoal,
      daily_goal_options: options,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .select("id");

  if (error || !data?.length) {
    console.error("[Admin] Saving app settings failed", { code: error?.code });
    return { success: false, error: "unexpected" };
  }

  revalidatePath("/admin");
  revalidatePath("/settings");
  return { success: true };
}
