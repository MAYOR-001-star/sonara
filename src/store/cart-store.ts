"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type CartLine = {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  accent: "peach" | "mist" | "ink";
};

export type CartLineSeed = Omit<CartLine, "quantity">;

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  isRealtimeConnected: boolean;
  lastSyncedAt: Date | null;
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
  setLines: (lines: CartLine[]) => void;
  addLine: (product: Omit<CartLine, "quantity">, quantity?: number) => void;
  fillCart: (products: CartLineSeed[]) => void;
  removeLine: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const MAX_PER_LINE = 10;
export const WEBSOCKET_CHANNEL = "audiophile_cart_websocket_sync";

// Global WebSocket channel reference and queue
let wsChannel: RealtimeChannel | null = null;
let pendingBroadcast: CartLine[] | null = null;
let isChannelInitializing = false;

export function setWebSocketChannel(ch: RealtimeChannel | null) {
  wsChannel = ch;
}

export function broadcastCart(lines: CartLine[]) {
  if (wsChannel && useCartStore.getState().isRealtimeConnected) {
    wsChannel
      .send({
        type: "broadcast",
        event: "cart_sync",
        payload: { lines },
      })
      .then((status) => {
        if (status !== "ok") {
          console.warn("[WebSocket Cart Sync] Broadcast returned non-ok status:", status);
        }
      })
      .catch((err) => {
        console.error("[WebSocket Cart Sync] Broadcast send error:", err);
      });
  } else {
    // Queue to send as soon as connection is ready
    pendingBroadcast = lines;
  }
}

/**
 * Initializes and maintains the Supabase Realtime WebSocket channel for the cart.
 * Idempotent: can be called safely from layout or StoreChrome.
 */
export function initCartWebSocket() {
  if (typeof window === "undefined") return () => {};
  if (wsChannel && useCartStore.getState().isRealtimeConnected) {
    return () => {};
  }
  if (isChannelInitializing) return () => {};

  isChannelInitializing = true;
  const supabase = createClient();

  const channel = supabase.channel(WEBSOCKET_CHANNEL, {
    config: { broadcast: { self: false } },
  });

  channel
    .on(
      "broadcast",
      { event: "cart_sync" },
      ({ payload }: { payload: { lines?: CartLine[] } }) => {
        if (payload?.lines && Array.isArray(payload.lines)) {
          useCartStore.setState({
            lines: payload.lines,
            lastSyncedAt: new Date(),
          });
        }
      },
    )
    .on("broadcast", { event: "cart_request" }, () => {
      // Another device just connected and requested current cart
      const currentLines = useCartStore.getState().lines;
      if (currentLines.length > 0 && channel) {
        channel.send({
          type: "broadcast",
          event: "cart_sync",
          payload: { lines: currentLines },
        });
      }
    })
    .subscribe((status: string, err?: Error) => {
      isChannelInitializing = false;
      if (status === "SUBSCRIBED") {
        wsChannel = channel;
        useCartStore.setState({ isRealtimeConnected: true });

        // Flush any broadcast that occurred during initial connection
        if (pendingBroadcast) {
          channel.send({
            type: "broadcast",
            event: "cart_sync",
            payload: { lines: pendingBroadcast },
          });
          pendingBroadcast = null;
        } else if (useCartStore.getState().lines.length === 0) {
          // If our cart is empty, ask any active peer (e.g. mobile) for their current cart
          channel.send({
            type: "broadcast",
            event: "cart_request",
            payload: {},
          });
        }
      } else if (
        status === "CLOSED" ||
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT"
      ) {
        useCartStore.setState({ isRealtimeConnected: false });
        if (err) {
          console.warn("[WebSocket Cart Sync] Connection status:", status, err);
        }
      }
    });

  return () => {
    // Keep connection alive across client navigation
  };
}

// Background database sync
async function syncUpsert(userId: string, line: CartLine) {
  try {
    const supabase = createClient();
    await supabase.from("cart_items").upsert(
      {
        user_id: userId,
        product_id: line.id,
        product_name: line.name,
        product_slug: line.slug || line.id,
        unit_price: line.price,
        quantity: line.quantity,
        accent: line.accent || "mist",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,product_id" },
    );
  } catch {}
}

async function syncDelete(userId: string, productId: string) {
  try {
    const supabase = createClient();
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
  } catch {}
}

async function syncClear(userId: string) {
  try {
    const supabase = createClient();
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);
  } catch {}
}

export const useCartStore = create<CartState>()((set, get) => ({
  lines: [],
  isOpen: false,
  isRealtimeConnected: false,
  lastSyncedAt: null,
  currentUserId: null,

  setCurrentUserId: (id) => set({ currentUserId: id }),
  setLines: (lines) => set({ lines, lastSyncedAt: new Date() }),

  addLine: (product, quantity = 1) => {
    const qty = Math.max(1, Math.min(MAX_PER_LINE, quantity));
    const state = get();
    const existing = state.lines.find((l) => l.id === product.id);

    let updatedLine: CartLine;
    let nextLines: CartLine[];

    if (existing) {
      const newQty = Math.min(MAX_PER_LINE, existing.quantity + qty);
      updatedLine = { ...existing, quantity: newQty };
      nextLines = state.lines.map((l) => (l.id === product.id ? updatedLine : l));
    } else {
      updatedLine = { ...product, quantity: qty };
      nextLines = [...state.lines, updatedLine];
    }

    set({ lines: nextLines, isOpen: true, lastSyncedAt: new Date() });

    // 1. Instant WebSocket broadcast
    broadcastCart(nextLines);

    // 2. Database save in background
    if (state.currentUserId) {
      syncUpsert(state.currentUserId, updatedLine);
    }
  },

  fillCart: (products) => {
    const nextLines = products.map((product) => ({
      ...product,
      quantity: Math.min(MAX_PER_LINE, 1),
    }));
    set({ lines: nextLines, isOpen: true, lastSyncedAt: new Date() });
    broadcastCart(nextLines);
  },

  removeLine: (id) => {
    const state = get();
    const nextLines = state.lines.filter((l) => l.id !== id);
    set({ lines: nextLines, lastSyncedAt: new Date() });

    // 1. Instant WebSocket broadcast
    broadcastCart(nextLines);

    // 2. Database delete in background
    if (state.currentUserId) {
      syncDelete(state.currentUserId, id);
    }
  },

  setQuantity: (id, quantity) => {
    const state = get();
    const clampedQty = Math.max(1, Math.min(MAX_PER_LINE, quantity));
    const target = state.lines.find((l) => l.id === id);

    const nextLines = state.lines.map((l) =>
      l.id === id ? { ...l, quantity: clampedQty } : l,
    );

    set({ lines: nextLines, lastSyncedAt: new Date() });

    // 1. Instant WebSocket broadcast
    broadcastCart(nextLines);

    // 2. Database update in background
    if (state.currentUserId && target) {
      syncUpsert(state.currentUserId, { ...target, quantity: clampedQty });
    }
  },

  clear: () => {
    const state = get();
    set({ lines: [], lastSyncedAt: new Date() });

    // 1. Instant WebSocket broadcast empty cart
    broadcastCart([]);

    // 2. Database clear in background
    if (state.currentUserId) {
      syncClear(state.currentUserId);
    }
  },

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export const useCartCount = () =>
  useCartStore((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
