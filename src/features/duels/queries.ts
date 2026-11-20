import type { SupabaseClient } from "@supabase/supabase-js";

import { duelSummarySchema, type DuelSummary } from "./duels";

// My duels, newest first: open invites and history (duels_list settles stale ones).
export async function getDuels(supabase: SupabaseClient): Promise<DuelSummary[]> {
  const { data, error } = await supabase.rpc("duels_list");
  if (error) throw error;
  return duelSummarySchema.array().parse(data ?? []);
}
