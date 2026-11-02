import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_callback", origin),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Auth] Callback failed", {
      code: error.code,
      status: error.status,
    });

    return NextResponse.redirect(
      new URL("/login?error=confirmation_failed", origin),
    );
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}
