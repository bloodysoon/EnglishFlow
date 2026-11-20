"use server";

import { revalidatePath } from "next/cache";

import { getLearningOverview } from "@/features/learning/queries";
import { createClient } from "@/lib/supabase/server";
import { equippedSchema } from "../inventory";
import { frameUnlocked, titleUnlocked } from "../levels";

type Result = { success: true } | { success: false; error: "invalid_data" | "locked" | "not_signed_in" | "unexpected" };

// Equips a title and frame, only if the learner's level has unlocked them.
export async function equipAction(input: unknown): Promise<Result> {
  const parsed = equippedSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    const { level } = (await getLearningOverview(supabase)).level;
    const { title, frame } = parsed.data;
    if ((title && !titleUnlocked(title, level)) || (frame && frame !== "none" && !frameUnlocked(frame, level))) {
      return { success: false, error: "locked" };
    }

    // RLS limits this to the learner's own row.
    const { data, error } = await supabase
      .from("profiles")
      .update({ equipped_title: title, equipped_frame: frame, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id");

    if (error || !data?.length) {
      console.error("[Inventory] Equipping failed", { code: error?.code, rows: data?.length ?? 0 });
      return { success: false, error: "unexpected" };
    }

    // The profile re-renders and refreshes its public snapshot.
    revalidatePath("/inventory");
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { success: false, error: "unexpected" };
  }
}
