import { createClient } from "./supabase/server";
import { getProduct } from "./catalog";
import { cartTotals, type Category } from "./products";
import { isSupabaseConfigured } from "./supabase/client";
import { sendOrderConfirmation } from "./mailgun";

export type CheckoutPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  paymentMethod: "e-Money" | "Cash on Delivery";
  eMoneyNumber?: string;
  eMoneyPin?: string;
  lines: { id: string; quantity: number }[];
};

export type CheckoutResult = {
  ok: boolean;
  orderId?: string;
  error?: string;
  emailSent?: boolean;
};

/** Short, human-friendly order reference, e.g. `AP-8F3K2Q`. */
function newOrderId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tail = Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
  return `AP-${tail}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(p: CheckoutPayload) {
  const errors: string[] = [];
  if (p.name.trim().length < 2) errors.push("Name is required.");
  if (!EMAIL_RE.test(p.email.trim())) errors.push("A valid email address is required.");
  if (p.address.trim().length < 5) errors.push("Shipping address is required.");
  if (p.zip.trim().length < 3) errors.push("ZIP / postal code is required.");
  if (p.city.trim().length < 2) errors.push("City is required.");
  if (p.country.trim().length < 2) errors.push("Country is required.");
  if (!p.lines?.length) errors.push("Your cart is empty.");
  if (p.paymentMethod === "e-Money") {
    if (!/^\d{4,12}$/.test(p.eMoneyNumber?.trim() ?? ""))
      errors.push("e-Money number must be 4-12 digits.");
    if (!/^\d{4}$/.test(p.eMoneyPin?.trim() ?? ""))
      errors.push("e-Money PIN must be 4 digits.");
  }
  return errors;
}

/**
 * Prices are ALWAYS recomputed server-side from the database. Prices sent by
 * the client are ignored so a tampered cart cannot change what is charged.
 */
export async function placeOrder(
  payload: CheckoutPayload,
  userId?: string,
): Promise<CheckoutResult> {
  const errors = validate(payload);
  if (errors.length) return { ok: false, error: errors.join(" ") };

  const resolved = [];
  for (const line of payload.lines) {
    const product = await getProduct(line.id);
    if (!product) return { ok: false, error: "A product in your cart no longer exists." };
    if (line.quantity < 1 || line.quantity > 10)
      return { ok: false, error: "Invalid quantity." };
    resolved.push({
      product,
      quantity: line.quantity,
      lineTotal: product.price * line.quantity,
    });
  }

  const { subtotal, shipping, vat, grandTotal } = cartTotals(
    resolved.map((r) => ({ price: r.product.price, quantity: r.quantity })),
  );

  const orderId = newOrderId();
  const shippingAddress = [
    payload.address,
    `${payload.city}, ${payload.zip}`,
    payload.country,
  ].join("\n");

  const summary = {
    orderId,
    email: payload.email.trim(),
    name: payload.name.trim(),
    lines: resolved.map((r) => ({
      name: r.product.name,
      category: r.product.category as Category,
      price: r.product.price,
      quantity: r.quantity,
    })),
    subtotal,
    shipping,
    vat,
    grandTotal,
    shippingAddress,
    paymentMethod: payload.paymentMethod,
  };

  // ---- Persist to Postgres (Supabase / Neon) -------------------------------
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          order_id: orderId,
          user_id: userId ?? null,
          customer_name: summary.name,
          customer_email: summary.email,
          phone: payload.phone || null,
          shipping_address: shippingAddress,
          payment_method: payload.paymentMethod,
          subtotal,
          shipping,
          vat,
          grand_total: grandTotal,
          status: "confirmed",
        })
        .select("id")
        .single();

      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        resolved.map((r) => ({
          order_id: order.id,
          product_id: r.product.id,
          product_name: r.product.name,
          unit_price: r.product.price,
          quantity: r.quantity,
          line_total: r.lineTotal,
        })),
      );
      if (itemsError) throw itemsError;
    } catch (err) {
      console.error("[orders] persistence failed:", err);
      return {
        ok: false,
        error: "We couldn't save your order. Please try again in a moment.",
      };
    }
  } else {
    console.warn("[orders] Supabase not configured - order not persisted.");
  }

  // ---- Send the confirmation email (Mailgun) -------------------------------
  const mail = await sendOrderConfirmation(summary);

  return { ok: true, orderId, emailSent: mail.ok };
}

/** Loads a previously placed order for the confirmation / receipt page. */
export async function getOrder(orderId: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_id", orderId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (err) {
    console.error("[orders] lookup failed:", err);
    return null;
  }
}
