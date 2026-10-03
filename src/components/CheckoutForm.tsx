"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";

type FieldKey =
  | "name"
  | "email"
  | "phone"
  | "address"
  | "zip"
  | "city"
  | "country"
  | "eMoneyNumber"
  | "eMoneyPin";

type Errors = Partial<Record<FieldKey, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: Record<FieldKey, string>, method: string): Errors {
  const e: Errors = {};
  if (values.name.trim().length < 2) e.name = "Enter your full name";
  if (!EMAIL_RE.test(values.email.trim())) e.email = "Enter a valid email address";
  if (values.phone && !/^[\d\s()+-]{7,20}$/.test(values.phone.trim()))
    e.phone = "Enter a valid phone number";
  if (values.address.trim().length < 5) e.address = "Enter your street address";
  if (values.zip.trim().length < 3) e.zip = "Enter your ZIP / postal code";
  if (values.city.trim().length < 2) e.city = "Enter your city";
  if (values.country.trim().length < 2) e.country = "Enter your country";
  if (method === "e-Money") {
    if (!/^\d{4,12}$/.test(values.eMoneyNumber.trim()))
      e.eMoneyNumber = "4-12 digits";
    if (!/^\d{4}$/.test(values.eMoneyPin.trim())) e.eMoneyPin = "4 digits";
  }
  return e;
}

const initial: Record<FieldKey, string> = {
  name: "",
  email: "",
  phone: "",
  address: "",
  zip: "",
  city: "",
  country: "",
  eMoneyNumber: "",
  eMoneyPin: "",
};


export default function CheckoutForm({
  defaultEmail = "",
  defaultName = "",
}: {
  defaultEmail?: string;
  defaultName?: string;
}) {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);

  const [values, setValues] = useState<Record<FieldKey, string>>({
    ...initial,
    email: defaultEmail,
    name: defaultName,
  });
  const [method, setMethod] = useState<"e-Money" | "Cash on Delivery">("e-Money");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set =
    (key: FieldKey) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (lines.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }

    const found = validate(values, method);
    setErrors(found);
    if (Object.keys(found).length) return;

    setPending(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          paymentMethod: method,
          lines: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFormError(data.error || "Something went wrong. Please try again.");
        setPending(false);
        return;
      }

      clear();
      // `sandboxed` is distinct from `skipped`: a sandboxed mail was accepted by
      // Mailgun and then dropped, which is the confusing case worth telling the
      // customer about rather than quietly showing a generic "not sent".
      const emailStatus = data.emailSent
        ? "sent"
        : data.emailSandboxed
          ? "sandboxed"
          : "skipped";
      router.push(
        `/order-success?order=${data.orderId}&email=${emailStatus}`,
      );
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setPending(false);
    }
  }


  const inputClass = (key: FieldKey) =>
    `field ${errors[key] ? "field-error" : ""}`;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      {formError && (
        <p
          role="alert"
          className="rounded-2xl border border-danger/40 bg-danger/5 px-5 py-4 text-sm text-danger"
        >
          {formError}
        </p>
      )}

      <fieldset>
        <legend className="text-[11px] font-bold tracking-[0.2em] text-peach uppercase">
          Billing details
        </legend>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Name" error={errors.name}>
            <input
              className={inputClass("name")}
              placeholder="Alexei Ward"
              value={values.name}
              onChange={set("name")}
              autoComplete="name"
            />
          </Field>

          <Field label="Email Address" error={errors.email}>
            <input
              className={inputClass("email")}
              type="email"
              placeholder="alexei@mail.com"
              value={values.email}
              onChange={set("email")}
              autoComplete="email"
            />
          </Field>

          <Field label="Phone Number" error={errors.phone} hint="Optional">
            <input
              className={inputClass("phone")}
              placeholder="+1 202-555-0136"
              value={values.phone}
              onChange={set("phone")}
              autoComplete="tel"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] font-bold tracking-[0.2em] text-peach uppercase">
          Shipping info
        </legend>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Your Address" error={errors.address} wide>
            <input
              className={inputClass("address")}
              placeholder="1137 Williams Avenue"
              value={values.address}
              onChange={set("address")}
              autoComplete="street-address"
            />
          </Field>

          <Field label="ZIP Code" error={errors.zip}>
            <input
              className={inputClass("zip")}
              placeholder="10001"
              value={values.zip}
              onChange={set("zip")}
              autoComplete="postal-code"
            />
          </Field>

          <Field label="City" error={errors.city}>
            <input
              className={inputClass("city")}
              placeholder="New York"
              value={values.city}
              onChange={set("city")}
              autoComplete="address-level2"
            />
          </Field>

          <Field label="Country" error={errors.country}>
            <select
              className={inputClass("country")}
              value={values.country}
              onChange={set("country")}
              autoComplete="country-name"
            >
              <option value="">Select a country</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>Canada</option>
              <option>Nigeria</option>
              <option>Ghana</option>
              <option>Germany</option>
              <option>France</option>
              <option>Other</option>
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] font-bold tracking-[0.2em] text-peach uppercase">
          Payment details
        </legend>

        <div className="mt-6 space-y-4">
          {(["e-Money", "Cash on Delivery"] as const).map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-colors ${
                method === m ? "border-peach bg-peach/5" : "border-tan bg-white"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="h-4 w-4 accent-peach"
              />
              <span className="text-sm font-bold">{m}</span>
            </label>
          ))}
        </div>

        {method === "e-Money" && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="e-Money Number" error={errors.eMoneyNumber}>
              <input
                className={inputClass("eMoneyNumber")}
                inputMode="numeric"
                placeholder="238521993"
                value={values.eMoneyNumber}
                onChange={set("eMoneyNumber")}
              />
            </Field>

            <Field label="e-Money PIN" error={errors.eMoneyPin}>
              <input
                className={inputClass("eMoneyPin")}
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="6891"
                value={values.eMoneyPin}
                onChange={set("eMoneyPin")}
              />
            </Field>
          </div>
        )}
      </fieldset>

      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
        {pending ? "Processing..." : "Continue & pay"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  wide,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <span className="field-label">
        {label}
        {hint && <span className="ml-2 text-ink/30 normal-case">{hint}</span>}
      </span>
      {children}
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          Wrong format &mdash; {error}
        </p>
      )}
    </div>
  );
}
