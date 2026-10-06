"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import { useCartStore, type CartLine } from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";

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

        if (error) {
          console.error("[CartDatabaseSync] Fetch error:", error.message);
          return;
        }

        if (data) {
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
        console.error("[CartDatabaseSync] Fetch failed:", err);
      }
    };

    // 1. Initial user check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        useCartStore.getState().setCurrentUserId(user.id);
        fetchDbCart(user.id);
      } else {
        useCartStore.getState().setCurrentUserId(null);
      }
    });

    // 2. Auth changes (only explicit login/logout)
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        useCartStore.getState().setCurrentUserId(session.user.id);
        fetchDbCart(session.user.id);
      } else if (event === "SIGNED_OUT") {
        useCartStore.getState().setCurrentUserId(null);
        useCartStore.getState().setLines([]);
      }
    });

    // 3. Shared Realtime subscription on cart_items table
    const channel = supabase
      .channel("cart_items_realtime_shared")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
        },
        () => {
          const currentUserId = useCartStore.getState().currentUserId;
          if (currentUserId) {
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
        <main className="min-h-screen">{children}</main>
      </>
    );
  }

  return (
    <>
      <CartDatabaseSync />
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
