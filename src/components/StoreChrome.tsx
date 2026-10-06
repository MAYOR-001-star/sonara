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
  WEBSOCKET_CHANNEL,
  setWebSocketChannel,
} from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";

function CartWebSocketSync() {
  useEffect(() => {
    const supabase = createClient();

    // 1. Connect to Supabase WebSocket Realtime Channel
    const channel = supabase.channel(WEBSOCKET_CHANNEL, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "cart_sync" }, ({ payload }) => {
        if (payload?.lines && Array.isArray(payload.lines)) {
          useCartStore.getState().setLines(payload.lines);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setWebSocketChannel(channel);
        }
      });

    // 2. Fetch initial cart from database if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        useCartStore.getState().setCurrentUserId(user.id);
        supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
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
          });
      }
    });

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        useCartStore.getState().setCurrentUserId(session.user.id);
      } else if (event === "SIGNED_OUT") {
        useCartStore.getState().setCurrentUserId(null);
        useCartStore.getState().setLines([]);
      }
    });

    return () => {
      setWebSocketChannel(null);
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
        <CartWebSocketSync />
        <main className="min-h-screen">{children}</main>
      </>
    );
  }

  return (
    <>
      <CartWebSocketSync />
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
