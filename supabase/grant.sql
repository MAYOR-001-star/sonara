-- =============================================================================
-- audiphile store - Supabase table grants
-- =============================================================================
-- Run this in Supabase -> SQL Editor -> New query -> Run.
--
-- Enabling RLS does not grant access. The PostgREST roles (anon, authenticated,
-- service_role) need explicit table privileges or every request fails with:
--     {"code":"42501","message":"permission denied for table products"}
--
-- Safe to run repeatedly.
-- =============================================================================

-- 1. Schema usage (needed once the database has other tables owned by others).
grant usage on schema public to anon, authenticated, service_role;

-- 2. Catalogue: read-only for everyone.
grant select on public.products to anon, authenticated, service_role;

-- 3. Orders: guests insert, then read their own receipt back within 24h.
grant insert on public.orders to anon, authenticated, service_role;
grant select on public.orders to anon, authenticated, service_role;

-- 4. Order lines.
grant insert on public.order_items to anon, authenticated, service_role;
grant select on public.order_items to anon, authenticated, service_role;

-- 5. Sequences (harmless if none exist yet).
grant all on all sequences in schema public to service_role;

-- 6. FIX: order_items had SELECT policies but no INSERT policy, so the order row
--    saved and then the line items failed with
--    `new row violates row level security policy for table "order_items"`,
--    surfacing to the customer as "We couldn't save your order."
--    Verified live against the running project on 2026-10-02.
drop policy if exists "anyone can create order items" on public.order_items;
create policy "anyone can create order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id is null or o.user_id = auth.uid())
    )
  );

-- 7. Verify: expect 8 rows. If 0, re-run supabase/seed.sql.
select count(*) as product_count from public.products;
