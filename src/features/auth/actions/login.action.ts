"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuthErrorCode } from "../errors";

type LoginInput = {
  email: string;
  password: string;
};

// Errors are codes; the form shows them in the page's language.
type LoginResult = { success: true } | { success: false; error: AuthErrorCode };

export async function loginAction({
  email,
  password,
}: LoginInput): Promise<LoginResult> {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || typeof password !== "string" || !password) {
    return { success: false, error: "required" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      if (error.message === "Email not confirmed") {
        return { success: false, error: "email_not_confirmed" };
      }

      return { success: false, error: "invalid_credentials" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "unexpected" };
  }
}
