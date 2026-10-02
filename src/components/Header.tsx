"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartCount, useCartStore } from "@/store/cart-store";
import { CartIcon } from "./AddToCartButton";
import { categories, categoryLabel, brandName } from "@/lib/products";
import AuthNavLink from "./AuthNavLink";

export default function Header() {
  const pathname = usePathname();
  const count = useCartCount();
  const toggle = useCartStore((s) => s.toggle);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-ink text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 md:px-10">
        <Link
          href="/"
          className="font-display text-xl font-extrabold tracking-[-0.02em] text-white"
        >
          {brandName.toLowerCase()}
          <span className="text-accent">.</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          <Link href="/" className="nav-link">
            Home
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/category/${c}`}
              className="nav-link"
              aria-current={pathname === `/category/${c}` ? "page" : undefined}
            >
              {categoryLabel[c]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          {/* Session-aware: shows Sign in, or Account + Sign out when signed in. */}
          <AuthNavLink />

          <button
            type="button"
            onClick={toggle}
            className="relative cursor-pointer text-white transition-opacity hover:opacity-70"
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <CartIcon className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-peach text-[10px] font-bold text-ink">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            className="cursor-pointer md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Full-screen overlay menu: the panel is fixed to the viewport instead of
          pushing page content down, and each link is a large centred row as in
          the design. `inset-0` + `top` offsets clear the sticky header bar. */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[61px] bottom-0 z-40 overflow-y-auto bg-ink md:hidden">
          <nav className="flex h-full flex-col items-center justify-center gap-2 px-5 py-10">
            <Link
              href="/"
              className="w-full py-4 text-center text-2xl font-extrabold tracking-[0.08em] text-white uppercase transition-colors hover:text-accent"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/category/${c}`}
                className="w-full py-4 text-center text-2xl font-extrabold tracking-[0.08em] text-white uppercase transition-colors hover:text-accent"
                onClick={() => setMobileOpen(false)}
              >
                {categoryLabel[c]}
              </Link>
            ))}
            <div className="mt-8 border-t border-white/10 pt-6">
              <AuthNavLink />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
