"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { profileSettingsSchema } from "../profile";

type Result =
  | { success: true; username: string }
  | { success: false; error: "invalid_data" | "taken" | "not_signed_in" | "unexpected" };

export async function updateProfileAction(input: unknown): Promise<Result> {
  const parsed = profileSettingsSchema.safeParse(input);
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
      .update({ username: parsed.data.username, is_public: parsed.data.isPublic, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id");

    // 23505: unique index on username.
    if (error?.code === "23505") return { success: false, error: "taken" };
    if (error || !data?.length) {
      console.error("[Profile] Saving the profile failed", { code: error?.code, rows: data?.length ?? 0 });
      return { success: false, error: "unexpected" };
    }

    revalidatePath(`/u/${parsed.data.username}`);
    return { success: true, username: parsed.data.username };
  } catch {
    return { success: false, error: "unexpected" };
  }
}
