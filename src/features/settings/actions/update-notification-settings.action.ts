"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

type Result = { success: true } | { success: false; error: "invalid_data" | "not_signed_in" | "unexpected" };

// Strict here (no defaults): the form always sends all three.
const inputSchema = z.object({ dueWords: z.boolean(), badges: z.boolean(), milestones: z.boolean() });

export async function updateNotificationSettingsAction(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    // RLS limits this to the learner's own row.
    const { data, error } = await supabase
      .from("profiles")
      .update({ notification_prefs: parsed.data, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id");

    if (error || !data?.length) {
      console.error("[Settings] Saving notification settings failed", { code: error?.code, rows: data?.length ?? 0 });
      return { success: false, error: "unexpected" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "unexpected" };
  }
}
