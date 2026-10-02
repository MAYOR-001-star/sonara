import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the request's cookies, so
 * `auth.getUser()` reflects the signed-in user in RSC / route handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — session refresh is handled by
            // the middleware, so this can be safely ignored.
          }
        },
      },
    },
  );
}

/** Signed-in user, or null. Returns null when Supabase is not configured. */
export async function getCurrentUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("your-project")) return null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}
