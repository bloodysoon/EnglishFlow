// The admin role lives in Supabase app_metadata, which only the project
// owner can set (Dashboard / SQL); users cannot change it themselves.
// The database checks the same claim (public.is_admin()).
export function isAdminUser(user: { app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return user?.app_metadata?.role === "admin";
}
