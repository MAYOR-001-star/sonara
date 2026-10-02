import Image from "next/image";
import Link from "next/link";
import { categories, categoryLabel, brandName } from "@/lib/products";

/** Real brand marks from `/public/socials`, tinted white via CSS filters. */
const socials = [
  { name: "Facebook", icon: "/socials/facebook.svg", href: "https://facebook.com" },
  { name: "Twitter", icon: "/socials/twitter.svg", href: "https://twitter.com" },
  { name: "Instagram", icon: "/socials/instagram.svg", href: "https://instagram.com" },
];

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-extrabold tracking-[-0.02em]">
            {brandName.toLowerCase()}
            <span className="text-accent">.</span>
          </p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
            {brandName} is an all in one stop to fulfil your audio needs. We are a
            small team of music lovers and sound specialists who are devoted to
            helping you get the most out of your personal audio. Come and visit
            our demo facility - we are open 7 days a week.
          </p>
          <div className="mt-8 flex items-center gap-5">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.name}
                className="transition-opacity hover:opacity-70"
              >
                <Image
                  src={s.icon}
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                  className="h-5 w-5 brightness-0 invert"
                />
              </a>
            ))}
          </div>
        </div>

        <nav>
          <p className="text-[11px] font-bold tracking-[0.2em] text-peach uppercase">
            Shop
          </p>
          <ul className="mt-5 space-y-3">
            {categories.map((c) => (
              <li key={c}>
                <Link
                  href={`/category/${c}`}
                  className="text-sm text-white/60 transition-colors hover:text-peach"
                >
                  {categoryLabel[c]}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/checkout"
                className="text-sm text-white/60 transition-colors hover:text-peach"
              >
                Checkout
              </Link>
            </li>
          </ul>
        </nav>

        <nav>
          <p className="text-[11px] font-bold tracking-[0.2em] text-peach uppercase">
            Support
          </p>
          <ul className="mt-5 space-y-3">
            <li>
              <Link
                href="/account"
                className="text-sm text-white/60 transition-colors hover:text-peach"
              >
                My account
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="text-sm text-white/60 transition-colors hover:text-peach"
              >
                Track an order
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="text-sm text-white/60 transition-colors hover:text-peach"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10 py-6">
        <p className="container-page text-xs text-white/40">
          Copyright {new Date().getFullYear()}. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
