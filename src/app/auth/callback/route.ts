import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth redirect target. Supabase sets the session cookies on the response,
 * then we send the user on to their original destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Only allow same-site relative redirects.
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    console.error("[auth/callback] code exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
