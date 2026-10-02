"use client";

import { useActionState } from "react";
import { signInWithGoogle, type AuthState } from "@/lib/auth-actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * The official four-colour Google "G" from the Google brand guidelines.
 * The previous hand-rolled path only drew the red arc, so the mark rendered
 * as a plain red G; these are the real logo paths.
 */
function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.29 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.71 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

const initialState: AuthState = { error: null, message: null };

/**
 * Google sign-in button. `redirect()` inside the server action navigates
 * automatically, so the returned error is only shown when the flow cannot
 * start (e.g. Supabase is not configured yet).
 */
export default function SignInButton({
  next = "/",
  variant = "compact",
  label,
  showIcon = true,
}: {
  next?: string;
  /** `compact` is the header trigger; `full` is the outlined auth-page button. */
  variant?: "compact" | "full";
  /** Overrides the button text, e.g. "Sign up" vs "Sign in". */
  label?: string;
  /** Hides the Google mark, for placements where it is visual noise. */
  showIcon?: boolean;
}) {
  const [state, formAction, pending] = useActionState(signInWithGoogle, initialState);

  const text = pending ? "Redirecting to Google..." : (label ?? "Sign in");

  const buttonClass =
    variant === "full"
      ? "flex w-full items-center justify-center gap-3 rounded-2xl border border-ink/15 bg-white px-6 py-4 text-sm font-semibold text-ink transition-colors hover:bg-mist disabled:opacity-50"
      : "nav-link flex items-center gap-2 disabled:opacity-50";

  return (
    <div className={variant === "full" ? "relative w-full" : "relative"}>
      <form action={formAction}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          disabled={pending}
          title={!isSupabaseConfigured() ? "Add Supabase + Google credentials to .env.local" : undefined}
          className={buttonClass}
        >
          {showIcon && (
            <GoogleIcon className={variant === "full" ? "h-5 w-5" : "h-4 w-4"} />
          )}
          {text}
        </button>
      </form>

      {state.error && (
        <span
          role="alert"
          className={
            variant === "full"
              ? "mt-4 block rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs leading-relaxed text-danger"
              : "absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-danger/40 bg-ink p-3 text-[11px] leading-relaxed text-white/90"
          }
        >
          {state.error}
        </span>
      )}
    </div>
  );
}
