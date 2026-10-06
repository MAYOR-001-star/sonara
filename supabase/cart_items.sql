-- ===========================================================================
-- CART ITEMS TABLE - Database-only cart storage
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/ayhniexiswjeosvreowc/sql/new)
-- ===========================================================================

-- 1. Create the cart_items table
create table if not exists public.cart_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  product_id   text not null,
  product_name text not null,
  product_slug text not null default '',
  unit_price   numeric(12, 2) not null check (unit_price >= 0),
  quantity     int not null check (quantity between 1 and 10),
  accent       text not null default 'mist',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, product_id)
);

-- Index for fast user queries
create index if not exists cart_items_user_idx on public.cart_items (user_id);

-- 2. Enable Row Level Security (RLS)
alter table public.cart_items enable row level security;

-- 3. Grant schema and table permissions
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.cart_items to anon, authenticated, service_role;

-- 4. RLS Policy: Users can only see and manage their own cart items
drop policy if exists "Users can manage their own cart items" on public.cart_items;
create policy "Users can manage their own cart items"
  on public.cart_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Enable Supabase Realtime so mobile and web sync instantly
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
