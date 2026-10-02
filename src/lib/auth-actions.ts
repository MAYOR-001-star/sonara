"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/client";

export type AuthState = {
  error: string | null;
  /** Non-fatal notice, e.g. "check your inbox to confirm your email". */
  message: string | null;
};

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Only allow same-site relative redirects, never an absolute/protocol URL. */
const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

type Credentials = { email: string; password: string; fullName: string };

/** Shared field validation for both credential actions. */
function readCredentials(
  formData: FormData,
): { credentials: Credentials | null; error: string | null } {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password) {
    return { credentials: null, error: "Email and password are required." };
  }
  if (!EMAIL_RE.test(email)) {
    return { credentials: null, error: "Please enter a valid email address." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      credentials: null,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  return { credentials: { email, password, fullName }, error: null };
}

/**
 * Starts the Google OAuth flow through Supabase.
 * The provider is enabled in Supabase -> Authentication -> Providers -> Google;
 * the Client ID/Secret from Google Cloud Console go there.
 */
export async function signInWithGoogle(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nothing: AuthState = { error: null, message: null };

  if (!isSupabaseConfigured()) {
    return {
      ...nothing,
      error:
        "Google sign-in is not configured yet. Add your Supabase and Google credentials to .env.local.",
    };
  }

  const next = safeNext(formData.get("next"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) return { ...nothing, error: error.message };
  if (data.url) redirect(data.url);

  return { ...nothing, error: "Could not start the Google sign-in flow." };
}

/**
 * Email + password sign-in. `redirect()` throws on success, so the returned
 * value is only ever an error the user needs to see inline.
 */
export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nothing: AuthState = { error: null, message: null };

  if (!isSupabaseConfigured()) {
    return {
      ...nothing,
      error: "Email sign-in is not configured yet. Add your Supabase credentials to .env.local.",
    };
  }

  const { credentials, error } = readCredentials(formData);
  if (error || !credentials) return { ...nothing, error };

  const next = safeNext(formData.get("next"));
  const supabase = await createClient();

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (authError) {
    return { ...nothing, error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

/**
 * Email + password sign-up. When Supabase has "Confirm email" enabled the
 * session is null and we return a notice instead of redirecting.
 */
export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nothing: AuthState = { error: null, message: null };

  if (!isSupabaseConfigured()) {
    return {
      ...nothing,
      error: "Email sign-up is not configured yet. Add your Supabase credentials to .env.local.",
    };
  }

  const { credentials, error } = readCredentials(formData);
  if (error || !credentials) return { ...nothing, error };

  if (credentials.password !== String(formData.get("confirmPassword") ?? "")) {
    return { ...nothing, error: "Passwords do not match." };
  }

  const next = safeNext(formData.get("next"));
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: credentials.fullName ? { full_name: credentials.fullName } : undefined,
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (authError) {
    // "already registered" is the common case; keep it friendly.
    return {
      ...nothing,
      error: authError.message.toLowerCase().includes("already")
        ? "An account with this email already exists. Try signing in instead."
        : authError.message,
    };
  }

  // No session means the user still has to confirm their email address.
  if (!data.session) {
    return {
      ...nothing,
      message: `Account created. Check ${credentials.email} to confirm your address, then sign in.`,
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

/**
 * Sends a password-reset email through Supabase. Always reports success so we
 * never reveal whether an address is registered.
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nothing: AuthState = { error: null, message: null };

  if (!isSupabaseConfigured()) {
    return {
      ...nothing,
      error: "Password reset is not configured yet. Add your Supabase credentials to .env.local.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email || !EMAIL_RE.test(email)) {
    return { ...nothing, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/reset-password`,
  });

  if (error) return { ...nothing, error: error.message };

  return {
    ...nothing,
    message: `If an account exists for ${email}, a reset link is on its way.`,
  };
}

/**
 * Sets a new password. Only works while the user holds a valid recovery
 * session, which Supabase grants via the emailed link's auth code.
 */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nothing: AuthState = { error: null, message: null };

  if (!isSupabaseConfigured()) {
    return { ...nothing, error: "Supabase is not configured yet." };
  }

  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ...nothing,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (password !== String(formData.get("confirmPassword") ?? "")) {
    return { ...nothing, error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ...nothing, error: error.message };

  return { ...nothing, message: "Password updated. Redirecting..." };
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
