"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import { useCartStore } from "@/store/cart-store";
import { seedProducts } from "@/lib/seed-products";

const seedLines = () =>
  seedProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    // Checkout prices come from the server map; this is display-only and
    // matches the seeded value so the console helper looks consistent.
    price: p.price,
    accent: p.accent,
  }));

/**
 * Development-only convenience: exposes `window.fillCart()` to put one of every
 * catalogue product in the cart, which is handy for eyeballing checkout totals
 * and the summary rows without clicking through eight product pages.
 *
 * `?fillCart=1` on any URL does the same thing on load, for when the console is
 * unavailable.
 *
 * Tree-shaken out of production builds via the NODE_ENV check, and it never
 * fills the cart on mount unless `?fillCart=1` is present.
 */
function DevCartFill() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const store = useCartStore;

    /** Applies the fill only once persisted state has been merged in, so the
     *  async rehydration can't overwrite the seeded lines. */
    const apply = () => store.getState().fillCart(seedLines());

    const fill = () => {
      if (store.persist.hasHydrated()) {
        apply();
        return;
      }
      const unsubscribe = store.persist.onFinishHydration(() => {
        unsubscribe();
        apply();
      });
    };

    const w = window as unknown as {
      fillCart?: () => void;
      clearCart?: () => void;
    };
    w.fillCart = fill;

    /** Empties the cart, once persisted state has been merged in so the clear
     *  isn't wiped by rehydration. */
    w.clearCart = () => {
      if (store.persist.hasHydrated()) {
        store.getState().clear();
        return;
      }
      const unsubscribe = store.persist.onFinishHydration(() => {
        unsubscribe();
        store.getState().clear();
      });
    };

    // Read straight off `window` rather than `useSearchParams`, which would
    // force every route rendered inside this chrome into a Suspense bailout.
    const params = new URLSearchParams(window.location.search);
    if (params.get("fillCart") === "1") {
      fill();
    }
    if (params.get("clearCart") === "1") {
      w.clearCart();
    }

    return () => {
      delete w.fillCart;
      delete w.clearCart;
    };
  }, [pathname]);

  return null;
}

// Routes that render full-screen without the store chrome.
const BARE_ROUTES = ["/login"];

export default function StoreChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isBare) {
    return (
      <>
        <DevCartFill />
        <main className="min-h-screen">{children}</main>
      </>
    );
  }

  return (
    <>
      <DevCartFill />
      <Header />
      {/* Column flex lets short auth pages fill the space between the header
          and footer without forcing a full 100vh scroll on top of them. */}
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
