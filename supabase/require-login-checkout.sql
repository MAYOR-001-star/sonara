-- =============================================================================
-- audiphile store - require a signed-in user for checkout (drop guest orders)
-- =============================================================================
-- Run in Supabase -> SQL Editor -> New query -> Run. Idempotent.
--
-- WHY: guest checkout is being retired. A guest order has `user_id is null`, so
-- it cannot be protected by an owner-scoped policy, which forced a blanket
-- "anyone can read recent guest orders" rule. That made every guest order's
-- name, email and shipping address readable by anyone holding the AP-XXXXXX
-- reference for 24 hours. With login required at checkout, every new order has
-- an owner and the permissive rules can go.
--
-- The anon INSERT grants stay: the storefront writes with the anon key plus the
-- customer's session cookie, and auth.uid() is populated from that cookie. The
-- INSERT policies below now require auth.uid() to be present, so an anonymous
-- caller can no longer create an order row.
--
-- Existing guest orders keep their current policies until they are cleaned up
-- (see cleanup-probe-orders.sql), so old receipts remain viewable to nobody
-- rather than becoming unviewable mid-deploy. Delete the legacy policies with
-- the statements at the bottom once you are happy to lock those rows out.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- orders: insert now requires a session.
-- ---------------------------------------------------------------------------
drop policy if exists "anyone can create orders" on public.orders;
create policy "signed-in users create orders"
  on public.orders for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- orders: reading your own order is the only way in. The blanket 24h guest read
-- rule is removed - it was the actual leak.
-- ---------------------------------------------------------------------------
drop policy if exists "anyone can read recent guest orders" on public.orders;

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders"
  on public.orders for select
  using (auth.uid() is not null and auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- order_items: visible only when the parent order is owned by the caller, and
-- insertable only for an order the caller owns.
-- ---------------------------------------------------------------------------
drop policy if exists "anyone can read items of recent orders" on public.order_items;
drop policy if exists "users read own order items" on public.order_items;
create policy "users read own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and auth.uid() is not null
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "anyone can create order items" on public.order_items;
create policy "signed-in users create order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and auth.uid() is not null
        and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Sanity check: the policies now in force on the two order tables.
-- Expect no "anyone can ..." rows for orders or order_items.
-- ---------------------------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'order_items')
order by tablename, cmd, policyname;
