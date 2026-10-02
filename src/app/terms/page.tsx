import type { Metadata } from "next";
import { supportEmail } from "@/lib/products";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the Sonora store.",
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold uppercase">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink/50">Last updated: February 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink/70">
        <p>
          By accessing or placing an order on the Sonora store, you agree to these
          terms. If you do not agree, please do not use the store.
        </p>

        <h2 className="text-lg font-bold uppercase">Accounts</h2>
        <p>
          An account is required to place an order. You are responsible for
          keeping your account credentials confidential and for all activity that
          occurs under your account. You must be old enough to form a binding
          contract in your jurisdiction to open an account.
        </p>
        <p>
          You can browse the catalogue without an account, but you cannot check
          out or view order details until you sign in. Your order history and
          receipts are tied to your account and are visible only to you.
        </p>

        <h2 className="text-lg font-bold uppercase">Orders and pricing</h2>
        <p>
          All orders are subject to acceptance. Prices are listed in US dollars
          and may change without notice. We reserve the right to refuse or cancel
          any order, including where a product is out of stock or listed with an
          incorrect price.
        </p>
        <p>
          Prices are calculated on our servers when you place an order. Any price
          or cart total shown in your browser is indicative only and will not
          determine what you are charged.
        </p>

        <h2 className="text-lg font-bold uppercase">Shipping and returns</h2>
        <p>
          Delivery estimates are estimates, not guarantees. To return a product,
          contact us within 14 days of delivery and send the item in its original
          condition and packaging. Final sale items are non-refundable.
        </p>

        <h2 className="text-lg font-bold uppercase">Intellectual property</h2>
        <p>
          The store design, text, graphics, and logos are owned by Sonora and may
          not be reproduced without written permission. Product names and marks
          remain the property of their respective owners.
        </p>

        <h2 className="text-lg font-bold uppercase">Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Sonora is not liable for any
          indirect or consequential damages arising from your use of the store.
          Our total liability is limited to the amount you paid for the relevant
          order.
        </p>

        <h2 className="text-lg font-bold uppercase">Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href={`mailto:${supportEmail()}`} className="font-bold underline">
            {supportEmail()}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
