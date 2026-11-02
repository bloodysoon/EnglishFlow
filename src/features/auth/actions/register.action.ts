"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "../schemas/auth.schema";

export async function registerAction(input: unknown) {
  const result = registerSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: "Invalid registration data",
    };
  }

  const supabase = await createClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    console.error("[Auth] NEXT_PUBLIC_APP_URL is not configured");

    return {
      success: false,
      error: "Registration is temporarily unavailable.",
      retryAfter: null,
    };
  }

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: new URL("/auth/callback", appUrl).toString(),
    },
  });

  if (error) {
    console.error("[Auth] Registration failed", {
      code: error.code,
      status: error.status,
    });

    if (
      error.status === 429 ||
      error.code === "over_request_rate_limit" ||
      error.code === "over_email_send_rate_limit"
    ) {
      const match = error.message.match(/after (\d+) seconds?/i);

      return {
        success: false,
        error: "Too many attempts. Please wait before trying again.",
        retryAfter: match ? Number(match[1]) : 60,
      };
    }

    return {
      success: false,
      error: "Registration failed. Please try again.",
      retryAfter: null,
    };
  }

  return {
    success: true,
    error: null,
    retryAfter: null,
  };
}
