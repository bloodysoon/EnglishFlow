"use server";

import { revalidatePath } from "next/cache";

import { publishWordSetSchema } from "../schemas";
import { getAdmin } from "../server";
import type { AdminActionResult } from "./result";

export async function publishWordSetAction(input: unknown): Promise<AdminActionResult> {
  const parsed = publishWordSetSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const admin = await getAdmin();
  if (!admin) return { success: false, error: "forbidden" };

  const { data, error } = await admin.supabase
    .from("word_sets")
    .update({ is_published: parsed.data.published })
    .eq("id", parsed.data.setId)
    .select("id");

  if (error) {
    console.error("[Admin] Publishing word set failed", { code: error.code });
    return { success: false, error: "unexpected" };
  }
  if (!data?.length) return { success: false, error: "not_found" };

  revalidatePath("/admin/word-sets", "layout");
  return { success: true };
}
