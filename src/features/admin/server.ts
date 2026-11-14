import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "./roles";

// Server only. The signed-in admin and a Supabase client acting as them,
// or null for everyone else. getUser() asks Supabase, so a forged cookie
// cannot pass; RLS checks the role again on every query.
export async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) return null;
  return { supabase, user };
}
