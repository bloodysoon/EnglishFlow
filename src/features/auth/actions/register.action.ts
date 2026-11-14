"use server";

import { createClient } from "@/lib/supabase/server";
import { localeSchema } from "@/features/i18n/locale-schema";
import type { AuthErrorCode } from "../errors";
import { registerSchema } from "../schemas/auth.schema";

// Errors are codes; the form shows them in the page's language.
type RegisterResult =
  | { success: true; error: null; retryAfter: null }
  | { success: false; error: AuthErrorCode; retryAfter: number | null };

const registerRequestSchema = registerSchema.extend({
  // Which language the confirmation link should bring the visitor back to.
  locale: localeSchema,
});

export async function registerAction(input: unknown): Promise<RegisterResult> {
  const result = registerRequestSchema.safeParse(input);

  if (!result.success) {
    return { success: false, error: "invalid_data", retryAfter: null };
  }

  const supabase = await createClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    console.error("[Auth] NEXT_PUBLIC_APP_URL is not configured");

    return { success: false, error: "unavailable", retryAfter: null };
  }

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: callbackUrl(appUrl, result.data.locale),
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
        error: "rate_limited",
        retryAfter: match ? Number(match[1]) : 60,
      };
    }

    return { success: false, error: "registration_failed", retryAfter: null };
  }

  return { success: true, error: null, retryAfter: null };
}

function callbackUrl(appUrl: string, locale: string): string {
  const url = new URL("/auth/callback", appUrl);
  if (locale !== "en") url.searchParams.set("locale", locale);
  return url.toString();
}
