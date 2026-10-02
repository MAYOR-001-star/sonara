"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  addLine: (product: Omit<CartLine, "quantity">, quantity?: number) => void;
  /** Puts one of every given product in the cart. Dev/testing helper. */
  fillCart: (products: CartLineSeed[]) => void;
  removeLine: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const MAX_PER_LINE = 10;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,

      addLine: (product, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.id === product.id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.id === product.id
                  ? {
                      ...l,
                      quantity: Math.min(MAX_PER_LINE, l.quantity + quantity),
                    }
                  : l,
              ),
              isOpen: true,
            };
          }
          return {
            lines: [
              ...state.lines,
              { ...product, quantity: Math.min(MAX_PER_LINE, quantity) },
            ],
            isOpen: true,
          };
        }),

      /* Replaces the cart with one of every product, each at quantity 1.
         Existing quantities are reset rather than incremented so repeated
         runs are idempotent. Quantities are still clamped to MAX_PER_LINE. */
      fillCart: (products) =>
        set((state) => ({
          lines: products.map((product) => ({
            ...product,
            quantity: Math.min(MAX_PER_LINE, 1),
          })),
          isOpen: true,
        })),

      removeLine: (id) =>
        set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),

      setQuantity: (id, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.id === id
              ? { ...l, quantity: Math.max(1, Math.min(MAX_PER_LINE, quantity)) }
              : l,
          ),
        })),

      clear: () => set({ lines: [], isOpen: false }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "audiophile-cart",
      storage: createJSONStorage(() => localStorage),
      // `isOpen` is UI state and must not be restored from storage.
      partialize: (state) => ({ lines: state.lines }) as CartState,
    },
  ),
);

export const useCartCount = () =>
  useCartStore((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
