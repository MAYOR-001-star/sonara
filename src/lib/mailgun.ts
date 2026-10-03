import {
  categoryLabel,
  formatPrice,
  brandName,
  brandNameLower,
  siteUrl,
} from "./products";

type OrderLine = {
  name: string;
  category: keyof typeof categoryLabel;
  price: number;
  quantity: number;
};

export type OrderSummary = {
  orderId: string;
  email: string;
  name: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  vat: number;
  grandTotal: number;
  shippingAddress: string;
  paymentMethod: string;
};

const apiKey = () => process.env.MAILGUN_API_KEY;
const domain = () => process.env.MAILGUN_DOMAIN;
const from = () =>
  process.env.MAILGUN_FROM || `${brandName} Store <orders@${domain()}>`;

export function isMailgunConfigured() {
  const d = domain();
  return Boolean(apiKey() && d && !d.includes("yourdomain"));
}

/**
 * A Mailgun *sandbox* domain only delivers to addresses you manually authorised
 * in the dashboard. Crucially, the Messages API still returns HTTP 200 for any
 * other recipient and then drops the message at delivery time - there is no API
 * error to catch. So a 2xx response on a sandbox domain does NOT mean anybody
 * received the email, and the app must never claim that it does.
 *
 * Set `MAILGUN_SANDBOX_LIMITS=false` once a real domain is verified, so the
 * check follows the verified domain rather than being flipped by hand.
 */
export function isSandboxDomain() {
  const d = (domain() || "").toLowerCase();
  const override = process.env.MAILGUN_SANDBOX_LIMITS;
  if (override === "false") return false;
  if (override === "true") return true;
  return d.includes("sandbox") || d.endsWith(".mailgun.org");
}

/**
 * What the customer should be told. Delivery is only guaranteed on a real
 * verified domain; on a sandbox the mail is silently discarded for anyone who
 * is not on the authorised-recipients list.
 */
export type EmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when the API accepted the message but it will not actually be delivered. */
  sandboxed?: boolean;
};

function orderRows(lines: OrderLine[]) {
  return lines
    .map(
      (l) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #DFD7CA">
          <span style="font-weight:700">${l.name}</span><br/>
          <span style="font-size:12px;color:#888">${categoryLabel[l.category]} &middot; Qty ${l.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #DFD7CA;text-align:right;white-space:nowrap">
          ${formatPrice(l.price * l.quantity)}
        </td>
      </tr>`,
    )
    .join("");
}

function totalRow(label: string, value: string, strong = false) {
  const w = strong ? "font-weight:800" : "font-size:13px;color:#666";
  const c = strong ? "color:#C98A52" : "";
  return `<tr><td colspan="2" style="padding-top:12px;${w}">${label}</td>
    <td style="padding-top:12px;text-align:right;${w};${c}">${value}</td></tr>`;
}

export function orderEmailHtml(o: OrderSummary) {
  return `<!doctype html>
<html><body style="margin:0;background:#FAFAFA;font-family:Manrope,Arial,sans-serif;color:#0F0D0D">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#0F0D0D;padding:28px 32px">
          <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-.01em">${brandName.toLowerCase()}</span>
        </td></tr>
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 8px;font-size:28px;text-transform:uppercase">Thank you for your order</h1>
          <p style="margin:0 0 24px;color:#555;font-size:15px">
            Hi ${o.name}, we've received your order and emailed this receipt to
            <strong>${o.email}</strong>. You'll receive a shipping confirmation shortly.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${orderRows(o.lines)}
            ${totalRow("Subtotal", formatPrice(o.subtotal))}
            ${totalRow("Shipping", formatPrice(o.shipping))}
            ${totalRow("VAT (included)", formatPrice(o.vat))}
            ${totalRow("Grand Total", formatPrice(o.grandTotal), true)}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#F1F1F1;border-radius:12px">
            <tr><td style="padding:20px;font-size:13px;line-height:1.7">
              <strong style="text-transform:uppercase;font-size:11px;letter-spacing:.12em">Shipping to</strong><br/>
              ${o.shippingAddress.replace(/\n/g, "<br/>")}<br/><br/>
              <strong style="text-transform:uppercase;font-size:11px;letter-spacing:.12em">Payment method</strong><br/>
              ${o.paymentMethod}
            </td></tr>
          </table>
          <p style="margin:28px 0 0">
            <a href="${siteUrl()}/orders/${o.orderId}"
               style="display:inline-block;background:#F5A97F;color:#0F0D0D;padding:16px 32px;border-radius:999px;
                      font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;text-decoration:none">
              View your order
            </a>
          </p>
          <p style="margin:28px 0 0;color:#999;font-size:12px">Order reference: ${o.orderId}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}



function orderEmailText(o: OrderSummary) {
  const lines = o.lines
    .map(
      (l) =>
        `- ${l.name} (${categoryLabel[l.category]}) x${l.quantity}  ${formatPrice(
          l.price * l.quantity,
        )}`,
    )
    .join("\n");

  return `Thank you for your order, ${o.name}!

Order reference: ${o.orderId}

${lines}

Subtotal:    ${formatPrice(o.subtotal)}
Shipping:    ${formatPrice(o.shipping)}
VAT:         ${formatPrice(o.vat)}
GRAND TOTAL: ${formatPrice(o.grandTotal)}

Shipping to:
${o.shippingAddress}

Payment method: ${o.paymentMethod}

View your order: ${siteUrl()}/orders/${o.orderId}

- ${brandNameLower}`;
}

/**
 * Sends the order confirmation through the Mailgun Messages API using Basic
 * auth (`api:API_KEY`). Returns `{ ok, error }` rather than throwing, so a mail
 * outage never fails an order that has already been persisted.
 *
 * `ok: true` means the mail will genuinely be delivered. On a sandbox domain
 * the API accepts everything with a 200 and drops what it may not send, so that
 * case returns `ok: false, sandboxed: true` instead of pretending to succeed.
 */
export async function sendOrderConfirmation(
  o: OrderSummary,
): Promise<EmailResult> {
  if (!isMailgunConfigured()) {
    console.warn("[mailgun] Not configured - skipping confirmation email.");
    return { ok: false, error: "Mailgun is not configured" };
  }

  const sandboxed = isSandboxDomain();

  try {
    const res = await fetch(`https://api.mailgun.net/v3/${domain()}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey()}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        from: from(),
        to: o.email,
        subject: `Your ${brandNameLower} order ${o.orderId} is confirmed`,
        html: orderEmailHtml(o),
        text: orderEmailText(o),
        // Lets you filter every order confirmation out in Mailgun -> Logs.
        "o:tag": "order-confirmation",
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[mailgun] send failed", res.status, payload);
      return { ok: false, error: payload?.message || `Mailgun ${res.status}` };
    }

    // A sandbox domain answers 200 and then silently discards the message for
    // any recipient that is not on the authorised list. Reporting `ok: true`
    // here would tell every other customer their receipt is on its way when it
    // was never delivered, so the sandbox case is flagged instead.
    if (sandboxed) {
      console.warn(
        `[mailgun] Sandbox domain - accepted but only delivers to authorised recipients. ${o.email} may not receive this.`,
      );
      return {
        ok: false,
        sandboxed: true,
        id: payload?.id as string | undefined,
        error:
          "Sandbox Mailgun domain: this address is not an authorised recipient, so the email will not be delivered.",
      };
    }

    return { ok: true, id: payload?.id as string | undefined };
  } catch (err) {
    console.error("[mailgun] request error", err);
    return { ok: false, error: (err as Error).message };
  }
}
