"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import {
  useCartStore,
  type CartLine,
  initCartWebSocket,
} from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";

function CartDatabaseAndAuthSync() {
  useEffect(() => {
    // 1. Initialize persistent Supabase WebSocket Realtime Cart Sync
    initCartWebSocket();

    const supabase = createClient();

    // 2. Fetch initial cart from database if user is logged in
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      const user = data.user;
      if (user) {
        useCartStore.getState().setCurrentUserId(user.id);
        supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .then(({ data: cartData, error }: { data: any[] | null; error: any }) => {
            if (!error && cartData && cartData.length > 0) {
              const mapped: CartLine[] = cartData.map((row: any) => ({
                id: row.product_id,
                name: row.product_name,
                slug: row.product_slug || row.product_id,
                price: Number(row.unit_price),
                quantity: Number(row.quantity),
                accent: (row.accent as "peach" | "mist" | "ink") || "peach",
              }));
              useCartStore.getState().setLines(mapped);
            }
          });
      }
    });

    // 3. Keep in sync with auth state changes
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event: string, session: { user?: { id: string } } | null) => {
      if (event === "SIGNED_IN" && session?.user) {
        useCartStore.getState().setCurrentUserId(session.user.id);
      } else if (event === "SIGNED_OUT") {
        useCartStore.getState().setCurrentUserId(null);
        useCartStore.getState().setLines([]);
      }
    });

    return () => {
      authSub.unsubscribe();
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

  return (
    <>
      <CartDatabaseAndAuthSync />
      {isBare ? (
        <main className="min-h-screen">{children}</main>
      ) : (
        <>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
          <CartDrawer />
        </>
      )}
    </>
  );
}
