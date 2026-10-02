import { NextResponse } from "next/server";
import { placeOrder, type CheckoutPayload } from "@/lib/orders";
import { getCurrentUser } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Per-IP ceiling. Generous for real shoppers, hostile to scripted abuse. */
const RATE_LIMIT = { limit: 5, windowMs: 60_000 };

/** POST /api/checkout — validates, prices, persists the order and emails it. */
export async function POST(request: Request) {
  // Throttle before doing any work: this handler writes two tables and sends an
  // email, so an unbounded endpoint is both a spam relay and a row-flood risk.
  const limit = rateLimit(`checkout:${clientIp(request)}`, RATE_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many checkout attempts. Please wait a minute and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds || 60),
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      },
    );
  }

  let payload: CheckoutPayload;

  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  // Middleware already rejects anonymous callers, but this route is reachable
  // directly and the check is the real enforcement point for the write below.
  // Guests are no longer accepted: an order without a user_id cannot be
  // protected by owner-scoped RLS, which is what lets it leak by reference.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in to check out." },
      { status: 401 },
    );
  }

  const result = await placeOrder(payload, user.id);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, {
    status: 201,
    headers: { "X-RateLimit-Remaining": String(limit.remaining) },
  });
}
