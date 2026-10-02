-- ===========================================================================
-- audiophile store - database schema
--
-- Works on Supabase (SQL Editor -> New query -> Run) and on any Postgres
-- provider (Neon, Railway, Supabase). It uses only standard Postgres features.
--
-- Optional: on Supabase you can instead paste `SUPABASE_DB_PASSWORD` into a
-- `psql` connection string and run this with `psql "$DATABASE_URL" -f schema.sql`.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  category    text not null check (category in ('headphones', 'speakers', 'earphones')),
  price       numeric(12, 2) not null check (price >= 0),
  description text,
  features    text[] not null default '{}',
  in_the_box  text[] not null default '{}',
  is_new      boolean not null default false,
  accent      text not null default 'mist' check (accent in ('peach', 'mist', 'ink')),
  created_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_id         text not null unique,           -- human reference, e.g. AP-8F3K2Q
  user_id          uuid references auth.users (id) on delete set null,
  customer_name    text not null,
  customer_email   text not null,
  phone            text,
  shipping_address text not null,
  payment_method   text not null,
  subtotal         numeric(12, 2) not null,
  shipping         numeric(12, 2) not null default 0,
  vat              numeric(12, 2) not null default 0,
  grand_total      numeric(12, 2) not null,
  status           text not null default 'confirmed',
  created_at       timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_order_id_idx on public.orders (order_id);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   text not null,
  product_name text not null,
  unit_price   numeric(12, 2) not null,
  quantity     int not null check (quantity between 1 and 10),
  line_total   numeric(12, 2) not null
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- The app writes orders through the anon key using the RLS policies below,
-- so you do NOT need the service-role key for checkout. Anyone may browse the
-- catalogue; only a signed-in user can read their own orders.
-- ---------------------------------------------------------------------------
alter table public.products   enable row level security;
alter table public.orders     enable row level security;
alter table public.order_items enable row level security;

-- Privileges. Enabling RLS does NOT grant access: the PostgREST roles also need
-- explicit table grants, or every query fails with
-- `42501 permission denied for table products` even when a policy allows it.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.products to anon, authenticated, service_role;
grant insert on public.orders to anon, authenticated, service_role;
grant select on public.orders to anon, authenticated, service_role;
grant insert on public.order_items to anon, authenticated, service_role;
grant select on public.order_items to anon, authenticated, service_role;
-- Sequences: order ids use gen_random_uuid(), so none are needed today, but the
-- service role gets them for any future serial column.
grant all on all sequences in schema public to service_role;

drop policy if exists "products are public" on public.products;
create policy "products are public"
  on public.products for select
  using (true);

-- Guest checkout: the order row is insertable, and user_id stays null for guests.
drop policy if exists "anyone can create orders" on public.orders;
create policy "anyone can create orders"
  on public.orders for insert
  with check (true);

-- A signed-in user can only read their own orders.
drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Guest receipts: the order-success page needs to re-read the order it just
-- created with no session, which the own-orders policy above forbids. Guest
-- rows have `user_id is null`, so a signed-in visitor can never match one; the
-- only way in is knowing the unguessable `AP-XXXXXX` reference, and only for 24h.
drop policy if exists "anyone can read recent guest orders" on public.orders;
create policy "anyone can read recent guest orders"
  on public.orders for select
  using (
    user_id is null
    and created_at > now() - interval '1 day'
  );

-- Items are visible when their parent order is visible.
drop policy if exists "users read own order items" on public.order_items;
create policy "users read own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

-- Line items are written as the second half of checkout, immediately after the
-- parent order row. Without this INSERT policy the order itself saves but
-- `order_items` fails with `new row violates row level security policy`, so the
-- insert must be allowed for any order the caller can see - a freshly created
-- one, or their own.
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

-- Guests can read the items of the order they just created (same request/anon
-- session), so the order-success page can show a receipt without an account.
drop policy if exists "anyone can read items of recent orders" on public.order_items;
create policy "anyone can read items of recent orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.created_at > now() - interval '1 day'
    )
  );
