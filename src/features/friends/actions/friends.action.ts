"use server";

import { revalidatePath } from "next/cache";

import { usernameSchema } from "@/features/profile/profile";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";
import { friendIdSchema, REQUEST_RESULTS, type RequestResult } from "../friends";

type Failure = { success: false; error: "invalid_data" | "not_signed_in" | "unexpected" };

// The database functions check who is asking (auth.uid()); signing in
// first only gives a clear error instead of an exception.
async function signedInClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

function refresh() {
  revalidatePath("/friends");
  revalidatePath("/timeline");
}

export async function sendFriendRequestAction(
  username: unknown,
): Promise<{ success: true; result: RequestResult } | Failure> {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  try {
    const supabase = await signedInClient();
    if (!supabase) return { success: false, error: "not_signed_in" };

    const { data, error } = await supabase.rpc("friend_request", { p_username: parsed.data });
    const result = REQUEST_RESULTS.find((r) => r === data);
    if (error || !result) {
      logSupabaseError("[Friends] Sending a request failed", error ?? data);
      return { success: false, error: "unexpected" };
    }
    refresh();
    return { success: true, result };
  } catch {
    return { success: false, error: "unexpected" };
  }
}

// accept: take their request; remove: unfriend, decline, cancel or unblock; block: block them.
const RPC = { accept: "friend_accept", remove: "friend_remove", block: "friend_block" } as const;

export async function updateFriendAction(
  action: keyof typeof RPC,
  userId: unknown,
): Promise<{ success: true } | Failure> {
  const parsed = friendIdSchema.safeParse(userId);
  if (!parsed.success || !(action in RPC)) return { success: false, error: "invalid_data" };

  try {
    const supabase = await signedInClient();
    if (!supabase) return { success: false, error: "not_signed_in" };

    const { error } = await supabase.rpc(RPC[action], { p_user: parsed.data });
    if (error) {
      logSupabaseError(`[Friends] ${action} failed`, error);
      return { success: false, error: "unexpected" };
    }
    refresh();
    return { success: true };
  } catch {
    return { success: false, error: "unexpected" };
  }
}
