import type { Metadata } from "next";
import { supportEmail } from "@/lib/products";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Sonora collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold uppercase">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink/50">Last updated: February 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink/70">
        <p>
          Sonora respects your privacy. This policy explains what information we
          collect when you use our store, why we collect it, and the choices you
          have.
        </p>

        <h2 className="text-lg font-bold uppercase">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account information:</strong> your email address, display
            name, and encrypted password when you create an account.
          </li>
          <li>
            <strong>Google account information:</strong> if you sign in with
            Google, we receive your name, email address, and profile picture. We
            never see or store your Google password.
          </li>
          <li>
            <strong>Order information:</strong> the products, quantities, and
            delivery details required to fulfil your order.
          </li>
        </ul>

        <h2 className="text-lg font-bold uppercase">Why we require an account</h2>
        <p>
          An account is required to place an order. Each order is tied to the
          account that placed it, and our database enforces this: an order record
          can only be read by the signed-in customer who owns it. Signing out, or
          opening an order link while signed in as somebody else, will not reveal
          your order details. This is how we keep your address and contact
          details from being exposed to other visitors.
        </p>

        <h2 className="text-lg font-bold uppercase">How we use your data</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>To create and secure your account.</li>
          <li>To process payments and fulfil your orders.</li>
          <li>To send order confirmations and password reset emails.</li>
          <li>To detect fraud and prevent abuse of our services.</li>
        </ul>

        <h2 className="text-lg font-bold uppercase">Data sharing</h2>
        <p>
          We do not sell your personal information. We share only the data needed
          to operate the store, with our payment processor, shipping carrier, and
          email delivery provider.
        </p>

        <h2 className="text-lg font-bold uppercase">Your rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal
          data at any time by contacting us. You can also reset or delete your
          account from your account settings.
        </p>

        <h2 className="text-lg font-bold uppercase">Contact</h2>
        <p>
          For any privacy questions, email us at{" "}
          <a href={`mailto:${supportEmail()}`} className="font-bold underline">
            {supportEmail()}
          </a>{" "}
          and we will respond as soon as possible.
        </p>
      </div>
    </section>
  );
}
