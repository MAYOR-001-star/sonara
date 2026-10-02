import { type NextRequest, NextResponse } from "next/server";
import {
  updateSession,
  getRequestUser,
  hasSupabaseEnv,
} from "@/lib/supabase/updateSession";

/**
 * Routes that require a signed-in user.
 *
 * Prefixes are matched against the pathname. The storefront (home, catalogue,
 * product and category pages) is deliberately public so anonymous visitors can
 * browse; everything that touches a customer's own data is listed here.
 *
 * `/checkout` and `/api/checkout` are protected too: guest checkout is no longer
 * offered, so every order has a `user_id` and RLS can require an owner match.
 * That removes the window in which a guest order was readable by anyone holding
 * the `AP-XXXXXX` reference.
 */
const PROTECTED_PREFIXES = [
  "/account",
  "/orders",
  "/order-success",
  "/checkout",
] as const;

/** API routes under the gate. These get a 401 JSON body, never a redirect. */
const PROTECTED_API_PREFIXES = ["/api/checkout"] as const;

/** Only same-site relative paths are ever used as a post-login destination. */
function safeNext(pathname: string) {
  return pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isProtected =
    isApi || PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) return await updateSession(request);

  // Only enforce when Supabase is actually configured, so local UI work without
  // credentials is not blocked by an auth wall that can never be satisfied.
  if (!hasSupabaseEnv()) return await updateSession(request);

  const { user } = await getRequestUser(request);

  if (user) return await updateSession(request);

  // Unauthenticated API call: JSON 401 rather than a redirect, so the client's
  // fetch() gets a real status instead of an HTML login page.
  if (isApi) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in to check out." },
      { status: 401 },
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", safeNext(pathname));
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
