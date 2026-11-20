import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { MEDALS, TITLE_IDS, type Equipped } from "./levels";

export const equippedSchema = z.object({
  title: z.enum(TITLE_IDS).nullable(),
  frame: z.enum([...MEDALS, "none"]).nullable(),
});

const NOTHING: Equipped = { title: null, frame: null };

// Server only. The learner's chosen title and frame; nothing chosen (or
// no migration yet) means both follow the level.
export async function getEquipped(supabase: SupabaseClient, userId: string): Promise<Equipped> {
  const { data, error } = await supabase
    .from("profiles")
    .select("equipped_title, equipped_frame")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return NOTHING;
  return equippedSchema.catch(NOTHING).parse({ title: data.equipped_title ?? null, frame: data.equipped_frame ?? null });
}
