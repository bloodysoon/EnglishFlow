import type { SupabaseClient } from "@supabase/supabase-js";

import { logSupabaseError } from "@/lib/supabase/log-error";

// Server only. Brings in today's new words (up to the daily goal) before
// a learning page renders. Idempotent: once the goal is met for the day
// it does nothing, so calling it on every visit is fine. A failure must
// not break the page, so it is only logged.
export async function introduceTodaysWords(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc("introduce_new_words");
  if (error) logSupabaseError("[Learn] introduce_new_words failed", error);
}
