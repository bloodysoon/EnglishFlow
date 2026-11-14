"use server";

import { revalidatePath } from "next/cache";

import { xpRulesSchema } from "../schemas";
import { getAdmin } from "../server";
import { xpRulesToRow } from "../xp-rules";
import type { AdminActionResult } from "./result";

export async function updateXpRulesAction(input: unknown): Promise<AdminActionResult> {
  const parsed = xpRulesSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const admin = await getAdmin();
  if (!admin) return { success: false, error: "forbidden" };

  const { data, error } = await admin.supabase
    .from("xp_rules")
    .update({ ...xpRulesToRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");

  if (error || !data?.length) {
    console.error("[Admin] Saving XP rules failed", { code: error?.code });
    return { success: false, error: "unexpected" };
  }

  revalidatePath("/admin");
  return { success: true };
}
