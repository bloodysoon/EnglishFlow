"use server";

import { createClient } from "@/lib/supabase/server";

type LoginInput = {
  email: string;
  password: string;
};

type LoginResult = { success: true } | { success: false; error: string };

export async function loginAction({
  email,
  password,
}: LoginInput): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return {
      success: false,
      error: "Email and password are required.",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      if (error.message === "Email not confirmed") {
        return {
          success: false,
          error: "Please confirm your email before signing in.",
        };
      }

      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
