// Logs a Supabase/PostgREST error with everything needed to diagnose it
// (code, message, details, hint, HTTP status) but no request data, so no
// user input or tokens end up in the logs.
export function logSupabaseError(context: string, error: unknown) {
  const e = (error ?? {}) as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown; status?: unknown };
  console.error(context, {
    code: e.code,
    message: e.message ?? String(error),
    details: e.details,
    hint: e.hint,
    status: e.status,
  });
}
