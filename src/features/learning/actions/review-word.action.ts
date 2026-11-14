"use server";

import { z } from "zod";

import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ wordId: z.uuid(), remembered: z.boolean() });

export type ReviewWordError = "invalid_data" | "not_signed_in" | "not_due" | "not_found" | "unexpected";

type Result =
  | { success: true; newBox: number; nextDueOn: string; xp: number; mastered: boolean }
  | { success: false; error: ReviewWordError };

// The database function does the work (box, due date, XP) and enforces
// the rules; this only validates input and translates its errors.
export async function reviewWordAction(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("review_word", {
      p_word_id: parsed.data.wordId,
      p_remembered: parsed.data.remembered,
    });

    if (error) {
      if (error.message.includes("not_authenticated")) return { success: false, error: "not_signed_in" };
      if (error.message.includes("not_due")) return { success: false, error: "not_due" };
      if (error.message.includes("word_not_in_my_words")) return { success: false, error: "not_found" };
      throw error;
    }

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
    if (!row) throw new Error("review_word returned no row");

    return {
      success: true,
      newBox: Number(row.new_box),
      nextDueOn: String(row.next_due_on),
      xp: Number(row.xp_awarded),
      mastered: Boolean(row.mastered),
    };
  } catch (error) {
    logSupabaseError("[Learn] Review failed", error);
    return { success: false, error: "unexpected" };
  }
}
