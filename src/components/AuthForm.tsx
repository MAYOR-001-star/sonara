"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  signInWithPassword,
  signUpWithPassword,
  type AuthState,
} from "@/lib/auth-actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const initialState: AuthState = { error: null, message: null };

/**
 * Email + password form shared by the sign-in and sign-up modes of /login.
 * `redirect()` inside the server action navigates on success, so anything
 * returned here is feedback the user has to read first.
 */
export default function AuthForm({
  mode,
  next = "/",
}: {
  /** `signup` adds the name + confirm-password fields. */
  mode: "signin" | "signup";
  next?: string;
}) {
  const isSignup = mode === "signup";
  const [state, formAction, pending] = useActionState(
    isSignup ? signUpWithPassword : signInWithPassword,
    initialState,
  );
  // `type` alone is not enough for a usable UX, so the eye button toggles it.
  const [showPassword, setShowPassword] = useState(false);

  const passwordType = showPassword ? "text" : "password";
  const errorClass = state.error ? "field-error" : "";

  return (
    <form action={formAction} className="w-full" noValidate>
      <input type="hidden" name="next" value={next} />

      {isSignup && (
        <div className="mb-5">
          <label htmlFor="fullName" className="field-label">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            className="field"
          />
        </div>
      )}

      <div className="mb-5">
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={`field ${errorClass}`}
        />
      </div>

      <div className="mb-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="field-label">
            Password
          </label>
          {isSignup ? (
            <span className="mb-2 text-[11px] text-ink/40">8 characters min</span>
          ) : (
            <Link
              href={`/forgot-password${
                next === "/" ? "" : `?next=${encodeURIComponent(next)}`
              }`}
              className="mb-2 text-[11px] text-ink/50 underline underline-offset-4 transition-colors hover:text-ink"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={passwordType}
            required
            minLength={8}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "Create a password" : "Enter your password"}
            className={`field pr-16 ${errorClass}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[11px] font-bold tracking-[0.12em] text-ink/40 uppercase hover:text-ink"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {isSignup && (
        <div className="mb-5">
          <label htmlFor="confirmPassword" className="field-label">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={passwordType}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repeat your password"
            className={`field ${errorClass}`}
          />
        </div>
      )}

      {state.error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs leading-relaxed text-danger"
        >
          {state.error}
        </p>
      )}

      {state.message && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-ink/15 bg-mist p-3 text-xs leading-relaxed text-ink/70"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        title={
          !isSupabaseConfigured()
            ? "Add Supabase credentials to .env.local"
            : undefined
        }
        className="btn-dark w-full disabled:opacity-50"
      >
        {pending
          ? isSignup
            ? "Creating account..."
            : "Signing in..."
          : isSignup
            ? "Sign up"
            : "Sign in"}
      </button>
    </form>
  );
}
