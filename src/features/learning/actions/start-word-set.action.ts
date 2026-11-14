"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/) });

type Result =
  | { success: true; added: number; introduced: number }
  | { success: false; error: "invalid_data" | "not_signed_in" | "unexpected" };

export async function startWordSetAction(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_signed_in" };

    // Queue the set's words, then let today's goal bring some in.
    const { data: added, error } = await supabase.rpc("start_word_set", { p_slug: parsed.data.slug });
    if (error) throw error;

    const { data: introduced, error: introduceError } = await supabase.rpc("introduce_new_words");
    if (introduceError) throw introduceError;

    revalidatePath("/learn");
    revalidatePath("/dashboard");
    return { success: true, added: Number(added ?? 0), introduced: Number(introduced ?? 0) };
  } catch (error) {
    logSupabaseError("[Learn] Starting a word set failed", error);
    return { success: false, error: "unexpected" };
  }
}
