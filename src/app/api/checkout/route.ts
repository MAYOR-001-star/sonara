import { NextResponse } from "next/server";
import { placeOrder, type CheckoutPayload } from "@/lib/orders";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** POST /api/checkout — validates, prices, persists the order and emails it. */
export async function POST(request: Request) {
  let payload: CheckoutPayload;

  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const result = await placeOrder(payload, user?.id);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
