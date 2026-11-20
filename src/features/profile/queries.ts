import type { SupabaseClient } from "@supabase/supabase-js";

import { getMyAchievements } from "@/features/achievements/queries";
import { getEquipped } from "@/features/rewards/inventory";
import { logSupabaseError } from "@/lib/supabase/log-error";
import type { BadgeId } from "@/features/achievements/achievements";
import { publicStats, publicStatsSchema, showcaseSchema, type PublicStats } from "./profile";

export type MyProfile = { username: string | null; isPublic: boolean; showcase: BadgeId[] };

export async function getMyProfile(supabase: SupabaseClient, userId: string): Promise<MyProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, is_public, showcase")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    username: data?.username ?? null,
    isPublic: data?.is_public === true,
    showcase: showcaseSchema.catch([]).parse(data?.showcase ?? []),
  };
}

// My achievements, with the public snapshot refreshed from them.
// shortcut: learners can write their own row (RLS), so a determined one
// could fake their own snapshot; compute it in SQL if that ever matters.
export async function getAchievementsAndPublish(supabase: SupabaseClient, userId: string) {
  const [data, pinned, equipped] = await Promise.all([
    getMyAchievements(supabase),
    supabase.from("profiles").select("showcase").eq("id", userId).maybeSingle(),
    getEquipped(supabase, userId),
  ]);
  const { overview, result } = data;
  const showcase = showcaseSchema.catch([]).parse(pinned.data?.showcase ?? []);
  const stats = publicStats(result, overview.level.level, overview.streak, overview.today, showcase, equipped);
  const { error } = await supabase.from("profiles").update({ public_stats: stats }).eq("id", userId);
  // The page still works with a stale snapshot.
  if (error) logSupabaseError("[Profile] Saving the public snapshot failed", error);
  return { ...data, publicStats: stats };
}

// Anyone may read a public profile; null when it is missing or private.
export async function getPublicProfile(
  supabase: SupabaseClient,
  username: string,
): Promise<{ username: string; stats: PublicStats | null } | null> {
  const { data, error } = await supabase.rpc("public_profile", { p_username: username });
  if (error) throw error;
  if (!data) return null;
  return {
    username: String(data.username),
    // Written by the app, but stored in a row the owner can edit.
    stats: publicStatsSchema.nullable().catch(null).parse(data.stats ?? null),
  };
}
