"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { showcaseSchema } from "../profile";

type Result = { success: true } | { success: false; error: "invalid_data" | "not_signed_in" | "unexpected" };

// Pins up to three badges. Unearned ones are dropped when the public
// snapshot is written (publicStats), so they never show.
export async function updateShowcaseAction(input: unknown): Promise<Result> {
  const parsed = showcaseSchema.safeParse(input);
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
      .update({ showcase: parsed.data, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id");

    if (error || !data?.length) {
      console.error("[Profile] Saving the showcase failed", { code: error?.code, rows: data?.length ?? 0 });
      return { success: false, error: "unexpected" };
    }

    // The profile page re-renders and refreshes the public snapshot.
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { success: false, error: "unexpected" };
  }
}
