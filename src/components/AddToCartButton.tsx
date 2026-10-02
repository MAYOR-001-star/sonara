"use client";

import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/lib/products";

export default function AddToCartButton({
  product,
  quantity = 1,
  className = "btn-primary",
  label = "Add to cart",
}: {
  product: Product;
  quantity?: number;
  className?: string;
  label?: string;
}) {
  const addLine = useCartStore((s) => s.addLine);

  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        addLine(
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            accent: product.accent,
          },
          quantity,
        )
      }
    >
      {label}
    </button>
  );
}

export function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </svg>
  );
}
