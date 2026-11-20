"use server";

import { revalidatePath } from "next/cache";

import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";
import { inviteSchema, respondSchema } from "../duels";

// Answers and state go straight from the browser to the duel_* functions
// (a server hop would add latency to a timed answer); invites and replies
// go through here. The database checks who is asking either way.
type Failure = { success: false; error: "invalid_data" | "not_signed_in" | "not_friends" | "busy" | "unexpected" };

async function signedInClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function inviteDuelAction(input: unknown): Promise<{ success: true; duelId: string } | Failure> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  try {
    const supabase = await signedInClient();
    if (!supabase) return { success: false, error: "not_signed_in" };

    const { data, error } = await supabase.rpc("duel_invite", {
      p_friend: parsed.data.friendId,
      p_league: parsed.data.league,
    });
    if (error?.message === "duel_not_friends") return { success: false, error: "not_friends" };
    if (error?.message === "duel_busy") return { success: false, error: "busy" };
    if (error || typeof data !== "string") {
      logSupabaseError("[Duels] Invite failed", error ?? data);
      return { success: false, error: "unexpected" };
    }
    revalidatePath("/duels");
    return { success: true, duelId: data };
  } catch {
    return { success: false, error: "unexpected" };
  }
}

// accept / decline (the invited friend) or cancel (the challenger).
// `open: false` means the invite was already answered, cancelled or expired.
export async function respondDuelAction(input: unknown): Promise<{ success: true; open: boolean } | Failure> {
  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  try {
    const supabase = await signedInClient();
    if (!supabase) return { success: false, error: "not_signed_in" };

    const { data, error } = await supabase.rpc("duel_respond", {
      p_duel: parsed.data.duelId,
      p_action: parsed.data.action,
    });
    if (error?.message === "duel_busy") return { success: false, error: "busy" };
    if (error) {
      logSupabaseError(`[Duels] ${parsed.data.action} failed`, error);
      return { success: false, error: "unexpected" };
    }
    revalidatePath("/duels");
    return { success: true, open: data === true };
  } catch {
    return { success: false, error: "unexpected" };
  }
}
