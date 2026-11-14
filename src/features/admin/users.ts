import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

export type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  isAdmin: boolean;
  translationLanguage: string | null;
  dailyGoal: number | null;
  wordCount: number;
  xpTotal: number;
};

export async function listUsers(supabase: SupabaseClient): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map((u) => ({
    id: String(u.id),
    email: String(u.email ?? ""),
    displayName: (u.display_name as string | null) ?? null,
    createdAt: String(u.created_at),
    lastSignInAt: (u.last_sign_in_at as string | null) ?? null,
    confirmed: Boolean(u.confirmed),
    isAdmin: Boolean(u.is_admin),
    translationLanguage: (u.translation_language as string | null) ?? null,
    dailyGoal: u.daily_goal === null || u.daily_goal === undefined ? null : Number(u.daily_goal),
    wordCount: Number(u.word_count ?? 0),
    xpTotal: Number(u.xp_total ?? 0),
  }));
}
