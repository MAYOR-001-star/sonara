import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/catalog";
import { shippingFlatRate, brandNameLower } from "@/lib/products";
import { getCurrentUser } from "@/lib/supabase/server";
import CheckoutForm from "@/components/CheckoutForm";
import OrderSummary from "@/components/OrderSummary";

export const metadata: Metadata = {
  title: "Checkout",
  description: `Complete your ${brandNameLower} order.`,
};

export default async function CheckoutPage() {
  const [user, products] = await Promise.all([getCurrentUser(), getProducts()]);

  // Authoritative prices, resolved server-side and passed to the summary so
  // the browser cannot influence what is charged.
  const pricesById = Object.fromEntries(
    products.map((p) => [p.id, p.price]),
  );

  return (
    <div className="bg-mist py-14">
      <div className="container-page">
        <Link
          href="/"
          className="text-[11px] font-bold tracking-[0.2em] text-ink/40 uppercase transition-colors hover:text-peach"
        >
          Go back
        </Link>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-3xl bg-white p-8 md:p-12">
            <h1 className="text-2xl">Checkout</h1>

            {!user && (
              <p className="mt-4 rounded-2xl bg-mist px-5 py-4 text-xs leading-relaxed text-ink/60">
                Checkout as a guest, or{" "}
                <Link href="/login?next=/checkout" className="font-bold text-peach">
                  sign in with Google
                </Link>{" "}
                to save your orders to your account. We will email your order
                confirmation either way.
              </p>
            )}

            <div className="mt-10">
              <CheckoutForm
                defaultEmail={user?.email ?? ""}
                defaultName={
                  (user?.user_metadata?.full_name as string | undefined) ?? ""
                }
              />
            </div>
          </section>

          <OrderSummary
            pricesById={pricesById}
            shipping={shippingFlatRate}
            className="lg:sticky lg:top-28"
          />
        </div>
      </div>
    </div>
  );
}
