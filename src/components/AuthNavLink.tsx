"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth-actions";

/**
 * Header auth control. The header is a client component and the session lives
 * in cookies, so we read it on the client and keep it in sync through
 * Supabase's auth events (which also fire right after sign in / sign out).
 */
export default function AuthNavLink() {
  // `null` means "not known yet"; a string is the signed-in email.
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Still a callback, so the setState is not synchronous in the effect body.
      queueMicrotask(() => setChecked(true));
      return;
    }

    const supabase = createClient();
    let active = true;

    // The session is resolved asynchronously, so `checked` flips afterwards
    // and the header never flashes "Sign in" for a signed-in user.
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setEmail(session?.user.email ?? null);
      setChecked(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!checked) {
    // Placeholder with the same width as the real trigger, so nothing shifts.
    return <span className="nav-link invisible">Sign in</span>;
  }

  if (email) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/account" className="nav-link" title={email}>
          Account
        </Link>
        <form action={signOut}>
          <button type="submit" className="nav-link cursor-pointer">
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link href="/login" className="nav-link">
      Sign in
    </Link>
  );
}
