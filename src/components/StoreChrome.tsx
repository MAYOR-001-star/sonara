"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import { useCartStore, type CartLine } from "@/store/cart-store";
import { seedProducts } from "@/lib/seed-products";
import { createClient } from "@/lib/supabase/client";

const seedLines = () =>
  seedProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    accent: p.accent,
  }));

function CartDatabaseSync() {
  useEffect(() => {
    const supabase = createClient();

    const fetchDbCart = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        if (!error && data) {
          const mapped: CartLine[] = data.map((row) => ({
            id: row.product_id,
            name: row.product_name,
            slug: row.product_slug || row.product_id,
            price: Number(row.unit_price),
            quantity: Number(row.quantity),
            accent: (row.accent as "peach" | "mist" | "ink") || "peach",
          }));
          useCartStore.getState().setLines(mapped);
        }
      } catch (err) {
        console.warn("[CartDatabaseSync] Fetch failed:", err);
      }
    };

    // 1. Initial user check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        useCartStore.getState().setCurrentUserId(user.id);
        fetchDbCart(user.id);
      } else {
        useCartStore.getState().setCurrentUserId(null);
        useCartStore.getState().setLines([]);
      }
    });

    // 2. Auth changes (login / logout)
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        useCartStore.getState().setCurrentUserId(session.user.id);
        fetchDbCart(session.user.id);
      } else {
        useCartStore.getState().setCurrentUserId(null);
        useCartStore.getState().setLines([]);
      }
    });

    // 3. Realtime subscription on cart_items table
    const channel = supabase
      .channel("web_cart_items_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
        },
        async (payload) => {
          const currentUserId = useCartStore.getState().currentUserId;
          const targetUserId =
            (payload.new as { user_id?: string })?.user_id ||
            (payload.old as { user_id?: string })?.user_id;

          if (currentUserId && targetUserId === currentUserId) {
            fetchDbCart(currentUserId);
          }
        },
      )
      .subscribe();

    return () => {
      authSub.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}

function DevCartFill() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const store = useCartStore;
    const apply = () => store.getState().fillCart(seedLines());

    const w = window as unknown as {
      fillCart?: () => void;
      clearCart?: () => void;
    };
    w.fillCart = apply;
    w.clearCart = () => store.getState().clear();

    const params = new URLSearchParams(window.location.search);
    if (params.get("fillCart") === "1") {
      apply();
    }
    if (params.get("clearCart") === "1") {
      store.getState().clear();
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
        <CartDatabaseSync />
        <DevCartFill />
        <main className="min-h-screen">{children}</main>
      </>
    );
  }

  return (
    <>
      <CartDatabaseSync />
      <DevCartFill />
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
