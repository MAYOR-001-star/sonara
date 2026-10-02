import type { Metadata } from "next";
import { getProducts } from "@/lib/catalog";
import { shippingFlatRate, brandNameLower } from "@/lib/products";
import { getCurrentUser } from "@/lib/supabase/server";
import CheckoutForm from "@/components/CheckoutForm";
import OrderSummary from "@/components/OrderSummary";
import BackLink from "@/components/BackLink";

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
        <BackLink
          fallbackHref="/"
          className="text-[11px] font-bold tracking-[0.2em] text-ink/40 uppercase transition-colors hover:text-peach"
        >
          Go back
        </BackLink>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-3xl bg-white p-8 md:p-12">
            <h1 className="text-2xl">Checkout</h1>

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
