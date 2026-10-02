import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignInButton from "@/components/SignInButton";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/supabase/server";
import { brandName, brandNameLower } from "@/lib/products";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; mode?: string }>;
}) {
  const { next, error, mode } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  const isSignup = mode !== "signin";

  // Already signed in? No reason to show the forms.
  const user = await getCurrentUser();
  if (user) redirect(safeNext);

  const copy = isSignup
    ? {
        switcher: { prompt: "Already have an account?", action: "Sign In" },
        switchHref: "/login?mode=signin",
        heading: `Join ${brandNameLower} today`,
        sub: "Create your account to track orders and check out faster.",
        cta: "Sign up with Google",
      }
    : {
        switcher: { prompt: `New to ${brandNameLower}?`, action: "Sign Up" },
        switchHref: "/login?mode=signup",
        heading: "Welcome back",
        sub: "Sign in to track your orders and check out faster.",
        cta: "Sign in with Google",
      };

  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      {/* ---- Left: dark brand panel ---- */}
      <aside className="relative hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <Link
          href="/"
          aria-label={`${brandName} home`}
          className="font-display text-2xl font-extrabold tracking-[-0.02em] text-white"
        >
          {brandName.toLowerCase()}
          <span className="text-accent">.</span>
        </Link>

        <div className="max-w-sm">
          <h2 className="text-3xl leading-tight font-extrabold uppercase">
            Just <span className="text-peach">listen</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            Join thousands of music lovers who trust {brandNameLower} for their
            listening needs.
          </p>
          <div className="mt-8 flex gap-2" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-peach" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          </div>
        </div>

        <p className="text-[11px] text-white/40">
          &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
        </p>
      </aside>

      {/* ---- Right: Google-only auth panel ---- */}
      <div className="flex items-center justify-center bg-white px-6 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <p className="text-center text-sm text-ink/50">
            {copy.switcher.prompt}{" "}
            <Link
              href={`${copy.switchHref}${safeNext === "/" ? "" : `&next=${encodeURIComponent(safeNext)}`}`}
              className="font-bold text-ink underline underline-offset-4"
            >
              {copy.switcher.action}
            </Link>
          </p>

          <h1 className="mt-8 text-center text-2xl font-extrabold uppercase md:text-3xl">
            {copy.heading}
          </h1>
          <p className="mt-3 text-center text-sm text-ink/50">{copy.sub}</p>

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-3 text-center text-xs text-danger"
            >
              Sign-in failed. Please try again.
            </p>
          )}

          {/* Email + password first; Google is the secondary option. */}
          <div className="mt-10">
            <AuthForm
              mode={isSignup ? "signup" : "signin"}
              next={safeNext}
            />
          </div>

          <div className="mt-8 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-tan" />
            <span className="text-[11px] tracking-[0.2em] text-ink/30 uppercase">
              Or continue with
            </span>
            <span className="h-px flex-1 bg-tan" />
          </div>

          <div className="mt-6">
            <SignInButton next={safeNext} variant="full" label={copy.cta} />
          </div>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-ink/40">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            .
            We never see or store your Google password.
          </p>
        </div>
      </div>
    </section>
  );
}
