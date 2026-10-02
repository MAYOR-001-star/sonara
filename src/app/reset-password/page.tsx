"use client";

import BackLink from "@/components/BackLink";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { updatePassword, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = { error: null, message: null };

/**
 * Sets a new password. Reached from the emailed Supabase recovery link, which
 * grants a temporary session via `?code=...`.
 */
export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // The recovery session is already established; send them on once saved.
  useEffect(() => {
    if (state.message) router.replace("/login?mode=signin");
  }, [state.message, router]);

  const passwordType = showPassword ? "text" : "password";
  const errorClass = state.error ? "field-error" : "";

  return (
    <section className="flex flex-1 items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-extrabold uppercase md:text-3xl">
          Choose a new password
        </h1>
        <p className="mt-3 text-sm text-ink/50">
          Pick something you have not used before. At least 8 characters.
        </p>

        <form action={formAction} className="mt-8 text-left" noValidate>
          <div className="mb-5">
            <label htmlFor="password" className="field-label">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={passwordType}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Create a password"
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

          <div className="mb-5">
            <label htmlFor="confirmPassword" className="field-label">
              Confirm new password
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
            className="btn-dark w-full disabled:opacity-50"
          >
            {pending ? "Saving..." : "Update password"}
          </button>
        </form>

        <p className="mt-8 text-sm text-ink/50">
          <BackLink
            fallbackHref="/login?mode=signin"
            className="font-bold text-ink underline underline-offset-4"
          >
            Back to sign in
          </BackLink>
        </p>
      </div>
    </section>
  );
}
