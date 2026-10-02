"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { useCartStore } from "@/store/cart-store";
import QuantityStepper from "./QuantityStepper";

/** Product hero block: art, price, quantity picker and Add to cart. */
export default function ProductPurchase({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const addLine = useCartStore((s) => s.addLine);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <QuantityStepper value={quantity} onChange={setQuantity} />
      <button
        type="button"
        className="btn-dark"
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
        Add to cart
      </button>
    </div>
  );
}
