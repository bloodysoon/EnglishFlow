"use server";

import { createClient } from "@/lib/supabase/server";
import { learningSettingsSchema } from "../schemas";
import { getPlan, maxDailyGoal } from "@/features/subscription/plans";

type Result = { success: true } | { success: false; error: "invalid_data" | "not_signed_in" | "unexpected" };

export async function updateLearningSettingsAction(input: unknown): Promise<Result> {
  const parsed = learningSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    // Any goal from 1 up to the plan's limit: the admin's options or a custom one.
    // (The SQL caps new words by plan anyway.)
    if (parsed.data.dailyGoal > maxDailyGoal(await getPlan(supabase))) {
      return { success: false, error: "invalid_data" };
    }

    // The row exists for every account (created by the on_auth_user_created
    // trigger, backfilled by the migration); learners may only update it.
    // RLS also limits this to their own row.
    const { data, error } = await supabase
      .from("profiles")
      .update({
        translation_language: parsed.data.translationLanguage,
        daily_goal: parsed.data.dailyGoal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id");

    if (error || !data?.length) {
      console.error("[Settings] Saving learning settings failed", { code: error?.code, rows: data?.length ?? 0 });
      return { success: false, error: "unexpected" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "unexpected" };
  }
}
