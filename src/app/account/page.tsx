import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth-actions";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = { title: "My account" };

type OrderRow = {
  id: string;
  order_id: string;
  grand_total: number;
  status: string;
  created_at: string;
};

export default async function AccountPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_id, grand_total, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as OrderRow[];

  return (
    <div className="container-page py-16">
      <p className="section-label">My account</p>
      <h1 className="mt-3 text-2xl md:text-3xl">
        {(
          (user.user_metadata?.full_name as string | undefined) ||
          user.email
        )}
      </h1>
      <p className="mt-2 text-sm text-ink/50">{user.email}</p>

      <form action={signOut} className="mt-8">
        <button type="submit" className="btn-outline">
          Sign out
        </button>
      </form>

      {/* Anchor target for the footer's "Track an order" link. scroll-mt keeps
          the heading clear of the sticky header when the fragment is followed. */}
      <h2 id="your-orders" className="mt-14 scroll-mt-28 text-xl">
        Your orders
      </h2>

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-ink/50">
          You have not placed any orders yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-tan border-y border-tan">
          {orders.map((o) => (
            <li key={o.id}>
              {/* The whole row is the link, so a customer can go straight from
                  "Track an order" to the receipt without hunting for it. */}
              <Link
                href={`/orders/${o.order_id}`}
                className="flex flex-wrap items-center justify-between gap-4 py-5 text-sm transition-colors hover:text-peach"
              >
                <div>
                  <p className="font-bold">{o.order_id}</p>
                  <p className="mt-1 text-xs text-ink/40">
                    {new Date(o.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[11px] font-bold tracking-[0.15em] text-peach uppercase">
                    {o.status}
                  </span>
                  <span className="font-extrabold">{formatPrice(o.grand_total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
