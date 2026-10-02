import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

function CheckIcon() {
  return (
    <Image
      src="/tick.svg"
      alt="Order confirmed"
      width={64}
      height={64}
      className="h-14 w-14"
      priority
    />
  );
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; email?: string }>;
}) {
  const { order, email } = await searchParams;

  // The order lookup is a nice-to-have; the confirmation renders either way.
  const record = order ? await getOrder(order) : null;
  const items = (record?.order_items ?? []) as {
    product_name: string;
    quantity: number;
    line_total: number;
  }[];

  return (
    <div className="bg-mist py-20">
      <div className="container-page">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center md:p-14">
          <div className="flex justify-center">
            <CheckIcon />
          </div>

          <h1 className="mt-8 text-2xl leading-tight md:text-3xl">
            Thank you for your order
          </h1>

          <p className="mt-4 text-sm text-ink/50">
            {email === "sent"
              ? "You will receive an email confirmation shortly."
              : "Your order is confirmed. We could not send the email just now, but your order is safely recorded."}
          </p>

          {items.length > 0 && (
            <ul className="mt-8 space-y-2 border-y border-tan py-6 text-left text-sm">
              {items.map((i) => (
                <li key={i.product_name} className="flex justify-between gap-4">
                  <span className="text-ink/70">
                    {i.product_name} &times; {i.quantity}
                  </span>
                  <span className="font-bold">{formatPrice(i.line_total)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-4 pt-3 text-base font-extrabold text-peach">
                <span>Grand total</span>
                <span>{formatPrice(record?.grand_total ?? 0)}</span>
              </li>
            </ul>
          )}

          {order && (
            <p className="mt-6 text-xs text-ink/40">
              Order reference: <strong className="text-ink">{order}</strong>
            </p>
          )}

          <div className="mt-10 space-y-3">
            {order && (
              <Link href={`/orders/${order}`} className="btn-outline w-full">
                View order details
              </Link>
            )}
            <Link href="/" className="btn-primary w-full">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
