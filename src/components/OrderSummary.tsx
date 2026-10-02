"use client";

import { formatPrice } from "@/lib/products";
import { useCartStore } from "@/store/cart-store";
import ProductArt from "./ProductArt";

/** Order summary card shown alongside the checkout form. */
export default function OrderSummary({
  pricesById,
  shipping,
  className = "",
}: {
  /** Server-supplied price map so the client never decides what to charge. */
  pricesById: Record<string, number>;
  shipping: number;
  className?: string;
}) {
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);

  const priced = lines
    // Prices come from the server-provided map; the client value is a display
    // fallback only and is never used to decide what to charge.
    .map((l) => ({ ...l, price: pricesById[l.id] ?? l.price }))
    .filter((l) => l.price !== undefined);

  const subtotal = priced.reduce((n, l) => n + l.price * l.quantity, 0);
  const vat = Math.round(subtotal * 0.2);
  const grandTotal = subtotal + vat + shipping;

  return (
    <aside className={`rounded-3xl bg-white p-8 ${className}`}>
      <h2 className="text-sm">Summary</h2>

      <ul className="mt-6 divide-y divide-tan">
        {priced.map((l) => (
          <li key={l.id} className="flex gap-4 py-5">
            <div className="w-16 shrink-0">
              <ProductArt
                category={
                  l.slug.includes("speaker")
                    ? "speakers"
                    : l.slug.includes("earphone")
                      ? "earphones"
                      : "headphones"
                }
                accent={l.accent}
                className="rounded-xl"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <p className="truncate text-sm font-bold">{l.name}</p>
                <span className="shrink-0 text-xs text-ink/50">
                  {formatPrice(l.price * l.quantity)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={l.quantity}
                  aria-label={`Quantity of ${l.name}`}
                  onChange={(e) =>
                    setQuantity(l.id, Number(e.target.value) || 1)
                  }
                  className="w-14 rounded-lg border border-tan bg-mist px-2 py-1 text-center text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeLine(l.id)}
                  className="cursor-pointer text-[11px] font-bold tracking-[0.15em] text-ink/40 uppercase hover:text-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {priced.length === 0 ? (
        <p className="py-6 text-sm text-ink/50">Your cart is empty.</p>
      ) : (
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Total" value={formatPrice(subtotal)} />
          <Row label="Shipping" value={formatPrice(shipping)} />
          <Row label="Vat (included)" value={formatPrice(vat)} />
          <div className="flex items-center justify-between border-t border-tan pt-4 text-base font-extrabold text-peach">
            <dt>Grand total</dt>
            <dd>{formatPrice(grandTotal)}</dd>
          </div>
        </dl>
      )}
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink/60">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
