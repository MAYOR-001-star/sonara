"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/client";

export type AuthState = { error: string | null };

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Starts the Google OAuth flow through Supabase.
 * The provider is enabled in Supabase -> Authentication -> Providers -> Google;
 * the Client ID/Secret from Google Cloud Console go there.
 */
export async function signInWithGoogle(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Google sign-in is not configured yet. Add your Supabase and Google credentials to .env.local.",
    };
  }

  const next = (formData.get("next") as string) || "/";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);

  return { error: "Could not start the Google sign-in flow." };
}

/** Signs the current user out and returns them to the home page. */
export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
