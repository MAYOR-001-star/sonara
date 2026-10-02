import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Order details",
  // Order pages are private and owner-scoped; keep them out of search indexes.
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  const items = (order.order_items ?? []) as {
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];

  return (
    <div className="container-page py-16">
      <p className="section-label">Order</p>
      <h1 className="mt-3 text-2xl md:text-3xl">{order.order_id}</h1>
      <p className="mt-2 text-sm text-ink/50">
        {order.customer_name} &middot; {order.customer_email}
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-[2fr_1fr]">
        <ul className="divide-y divide-tan border-y border-tan">
          {items.map((i) => (
            <li key={i.product_name} className="flex justify-between gap-4 py-5 text-sm">
              <span className="text-ink/70">
                {i.product_name} &times; {i.quantity}{" "}
                <span className="text-ink/30">
                  ({formatPrice(i.unit_price)} each)
                </span>
              </span>
              <span className="font-bold">{formatPrice(i.line_total)}</span>
            </li>
          ))}
        </ul>

        <aside className="rounded-3xl bg-mist p-8 text-sm">
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-ink/50">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/50">Shipping</dt>
              <dd>{formatPrice(order.shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/50">VAT</dt>
              <dd>{formatPrice(order.vat)}</dd>
            </div>
            <div className="flex justify-between border-t border-tan pt-3 text-base font-extrabold text-peach">
              <dt>Grand total</dt>
              <dd>{formatPrice(order.grand_total)}</dd>
            </div>
          </dl>
          <p className="mt-6 whitespace-pre-line text-xs leading-relaxed text-ink/50">
            {order.shipping_address}
          </p>
        </aside>
      </div>
    </div>
  );
}
