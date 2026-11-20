import type { SupabaseClient } from "@supabase/supabase-js";

import { friendEventSchema, friendSchema, type Friend, type FriendEvent } from "./friends";

// My friends, requests and the blocks I made, newest change first.
export async function getFriends(supabase: SupabaseClient): Promise<Friend[]> {
  const { data, error } = await supabase.rpc("friends_list");
  if (error) throw error;
  return friendSchema.array().parse(data ?? []);
}

// Every friendship I made, oldest first; kept after unfriending (RLS: my rows only).
export async function getFriendEvents(supabase: SupabaseClient): Promise<FriendEvent[]> {
  const { data, error } = await supabase
    .from("friend_events")
    .select("friend_username, created_at")
    .order("created_at");
  if (error) throw error;
  return friendEventSchema.array().parse(data ?? []);
}
