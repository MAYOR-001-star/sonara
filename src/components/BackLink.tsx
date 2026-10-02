"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// The referrer is fixed for the lifetime of this page, so the store never emits
// a change and `subscribe` intentionally does nothing.
const subscribe = () => () => {};
const getServerSnapshot = () => false;

/** True when the user arrived from another page on this same site. */
function hasSameOriginReferrer() {
  const referrer = document.referrer;
  if (!referrer) return false;
  try {
    return new URL(referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

type Props = {
  children: React.ReactNode;
  /** Where to send the user when there is no history to return to. */
  fallbackHref: string;
  className?: string;
};

/**
 * Navigates to the previous page in the session's history rather than jumping to
 * a fixed route. On a direct load (shared link, hard refresh) there is no prior
 * entry in this tab, so we render `fallbackHref` instead -- otherwise
 * `router.back()` would either do nothing or exit the site.
 */
export default function BackLink({ children, fallbackHref, className }: Props) {
  const router = useRouter();
  const canGoBack = useSyncExternalStore(
    subscribe,
    hasSameOriginReferrer,
    getServerSnapshot,
  );

  if (!canGoBack) {
    return (
      <Link href={fallbackHref} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => router.back()} className={className}>
      {children}
    </button>
  );
}