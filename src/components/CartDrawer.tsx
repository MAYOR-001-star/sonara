"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { cartTotals, formatPrice, productImages } from "@/lib/products";
import ProductArt from "./ProductArt";
import QuantityStepper from "./QuantityStepper";

export default function CartDrawer() {
  const { lines, isOpen, close, removeLine, setQuantity, clear } = useCartStore();
  const { subtotal, grandTotal } = cartTotals(lines);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  if (!isOpen) return null;

  const count = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close cart"
        onClick={close}
        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-tan px-7 py-6">
          <h2 className="text-sm">
            Cart ({count})
          </h2>
          {lines.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="cursor-pointer text-[11px] font-bold tracking-[0.15em] text-ink/40 uppercase transition-colors hover:text-danger"
            >
              Remove all
            </button>
          )}
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-7 text-center">
            <p className="text-sm text-ink/50">Your cart is empty.</p>
            <Link href="/" onClick={close} className="btn-primary">
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-tan overflow-y-auto px-7">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-5 py-6">
                  <Link href={`/product/${line.slug}`} onClick={close} className="w-20 shrink-0">
                    <ProductArt
                      category={
                        line.slug.includes("speaker")
                          ? "speakers"
                          : line.slug.includes("earphone")
                            ? "earphones"
                            : "headphones"
                      }
                      accent={line.accent}
                      image={productImages[line.id]?.hero}
                      alt={line.name}
                      sizes="80px"
                      className="rounded-xl"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-bold">{line.name}</p>
                    <p className="mt-1 text-xs text-ink/50">
                      {formatPrice(line.price)}
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(q) => setQuantity(line.id, q)}
                        small
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="cursor-pointer text-[11px] font-bold tracking-[0.15em] text-ink/40 uppercase hover:text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-tan px-7 py-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase">
                  Total
                </span>
                <span className="text-lg font-extrabold">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink/40">
                Shipping and taxes calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={close}
                className="btn-primary mt-5 w-full"
              >
                Checkout
              </Link>
              <p className="mt-3 text-center text-[11px] text-ink/40">
                Grand total with shipping &amp; tax: {formatPrice(grandTotal)}
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
