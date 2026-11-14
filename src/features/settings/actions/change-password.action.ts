"use server";

import { createClient } from "@/lib/supabase/server";
import { changePasswordSchema } from "../schemas";

export type ChangePasswordError =
  | "invalid_data"
  | "same_password"
  | "wrong_current_password"
  | "weak_password"
  | "rate_limited"
  | "not_signed_in"
  | "unexpected";

type Result = { success: true } | { success: false; error: ChangePasswordError };

export async function changePasswordAction(input: unknown): Promise<Result> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const same = parsed.error.issues.some((issue) => issue.message === "same_password");
    return { success: false, error: same ? "same_password" : "invalid_data" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { success: false, error: "not_signed_in" };

    // Prove it's really them: an unattended open session must not be
    // enough to take over the account. Signing in again also refreshes
    // the session, which Supabase's secure password change may require.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    });

    if (verifyError) {
      if (verifyError.status === 429 || verifyError.code === "over_request_rate_limit") {
        return { success: false, error: "rate_limited" };
      }
      return { success: false, error: "wrong_current_password" };
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });

    if (error) {
      console.error("[Settings] Password change failed", { code: error.code, status: error.status });
      if (error.code === "same_password") return { success: false, error: "same_password" };
      if (error.code === "weak_password") return { success: false, error: "weak_password" };
      if (error.status === 429) return { success: false, error: "rate_limited" };
      return { success: false, error: "unexpected" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "unexpected" };
  }
}
