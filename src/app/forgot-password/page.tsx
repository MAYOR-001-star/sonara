"use client";

import BackLink from "@/components/BackLink";
import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = { error: null, message: null };

/** Requests a Supabase password-reset email for the entered address. */
export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  void searchParams;

  return (
    <section className="flex flex-1 items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-extrabold uppercase md:text-3xl">
          Reset your password
        </h1>
        <p className="mt-3 text-sm text-ink/50">
          Enter the email you signed up with and we&apos;ll send you a link to
          choose a new password.
        </p>

        <form
          action={formAction}
          className="mt-8 text-left"
          noValidate
        >
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
              className={`field ${state.error ? "field-error" : ""}`}
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
            {pending ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-8 text-sm text-ink/50">
          Remembered it?{" "}
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
