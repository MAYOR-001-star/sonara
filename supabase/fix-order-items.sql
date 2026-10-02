-- =============================================================================
-- audiphile store - order_items INSERT policy fix + probe cleanup
-- =============================================================================
-- Run in Supabase -> SQL Editor -> New query -> Run. Idempotent.
--
-- WHY: order_items had SELECT policies but no INSERT policy. Checkout inserts the
-- parent order first (that worked), then the line items, which failed with
--   42501 new row violates row-level security policy for table "order_items"
-- and surfaced to the customer as "We couldn't save your order."
-- Grants alone cannot fix this - Postgres needs an explicit RLS write policy.
-- Verified live against this project on 2026-10-02.
-- =============================================================================

drop policy if exists "anyone can create order items" on public.order_items;
create policy "anyone can create order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.user_id is null
          or o.user_id = auth.uid()
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Sanity check A: the policy now exists. Expect one row.
-- ---------------------------------------------------------------------------
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'order_items'
order by cmd, policyname;

-- ---------------------------------------------------------------------------
-- Sanity check B: remove the diagnostic order I inserted while testing.
-- Cascades to its order_items via on delete cascade.
-- ---------------------------------------------------------------------------
delete from public.orders where order_id = 'AP-PROBE2';
