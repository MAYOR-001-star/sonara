"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

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

// Helper to push updates to Supabase cart_items table
async function syncUpsert(userId: string, line: CartLine) {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("cart_items").upsert(
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
    if (error) {
      console.error("[cart-store] Upsert error:", error.message);
    }
  } catch (err) {
    console.error("[cart-store] Upsert failed:", err);
  }
}

async function syncDelete(userId: string, productId: string) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    if (error) {
      console.error("[cart-store] Delete error:", error.message);
    }
  } catch (err) {
    console.error("[cart-store] Delete failed:", err);
  }
}

async function syncClear(userId: string) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);
    if (error) {
      console.error("[cart-store] Clear error:", error.message);
    }
  } catch (err) {
    console.error("[cart-store] Clear failed:", err);
  }
}

// Database-only store (no localStorage!)
export const useCartStore = create<CartState>()((set, get) => ({
  lines: [],
  isOpen: false,
  currentUserId: null,

  setCurrentUserId: (id) => set({ currentUserId: id }),
  setLines: (lines) => set({ lines }),

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

    set({ lines: nextLines, isOpen: true });

    if (state.currentUserId) {
      syncUpsert(state.currentUserId, updatedLine);
    }
  },

  fillCart: (products) =>
    set((state) => ({
      lines: products.map((product) => ({
        ...product,
        quantity: Math.min(MAX_PER_LINE, 1),
      })),
      isOpen: true,
    })),

  removeLine: (id) => {
    const state = get();
    set({ lines: state.lines.filter((l) => l.id !== id) });

    if (state.currentUserId) {
      syncDelete(state.currentUserId, id);
    }
  },

  setQuantity: (id, quantity) => {
    const state = get();
    const clampedQty = Math.max(1, Math.min(MAX_PER_LINE, quantity));
    const target = state.lines.find((l) => l.id === id);

    set({
      lines: state.lines.map((l) =>
        l.id === id ? { ...l, quantity: clampedQty } : l,
      ),
    });

    if (state.currentUserId && target) {
      syncUpsert(state.currentUserId, { ...target, quantity: clampedQty });
    }
  },

  clear: () => {
    const state = get();
    set({ lines: [] });

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
