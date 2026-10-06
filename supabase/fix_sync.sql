-- ===========================================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO UNBLOCK CART SYNC:
-- https://supabase.com/dashboard/project/ayhniexiswjeosvreowc/sql/new
-- ===========================================================================

-- 1. Disable RLS on cart_items so client inserts & deletes are never rejected
alter table public.cart_items disable row level security;

-- 2. Enable REPLICA IDENTITY FULL so deletes broadcast across Realtime
alter table public.cart_items replica identity full;

-- 3. Ensure Realtime is enabled on cart_items
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cart_items'
  ) then
    alter publication supabase_realtime add table public.cart_items;
  end if;
end;
$$;
