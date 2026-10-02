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

-- Checkout requires a signed-in user, so an order always has an owner. The
-- app also enforces this in middleware and in the route handler; these policies
-- are what stop a direct PostgREST call with the anon key.
drop policy if exists "anyone can create orders" on public.orders;
drop policy if exists "signed-in users create orders" on public.orders;
create policy "signed-in users create orders"
  on public.orders for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- A user can only read their own orders.
--
-- There is deliberately no blanket "read recent guest orders" rule. It existed
-- so guest receipts worked without an account, but it made every guest order's
-- name, email and shipping address readable by anyone holding the AP-XXXXXX
-- reference for 24 hours. Guest checkout is retired, so the rule is gone.
drop policy if exists "anyone can read recent guest orders" on public.orders;
drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders"
  on public.orders for select
  using (auth.uid() is not null and auth.uid() = user_id);

-- Items are visible only when the parent order is owned by the caller.
--
-- Without this INSERT policy the order saves but `order_items` fails with
-- `new row violates row level security policy`, so the insert must be allowed
-- for exactly the orders the caller owns.
drop policy if exists "anyone can read items of recent orders" on public.order_items;
drop policy if exists "anyone can create order items" on public.order_items;
drop policy if exists "signed-in users create order items" on public.order_items;
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
-- Grant the PostgREST roles access to the store tables.
--
-- Run this once if queries fail with
--   42501 permission denied for table products
-- Enabling RLS is not enough on its own: anon/authenticated also need explicit
-- table privileges, or every policy is unreachable. Idempotent - safe to re-run.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select on public.products to anon, authenticated, service_role;

grant insert, select on public.orders to anon, authenticated, service_role;

grant insert, select on public.order_items to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- Seed catalogue (matches src/lib/seed-products.ts)
-- ---------------------------------------------------------------------------
insert into public.products
  (id, slug, name, category, price, description, features, in_the_box, is_new, accent)
values
  ('p-xx99-mark-ii', 'xx99-mark-ii-headphones', 'XX99 Mark II Headphones', 'headphones', 2999,
   'The new XX99 Mark II headphones is the pinnacle of pristine audio. It redefines your premium headphone experience by reproducing the balanced depth and precision of studio-quality sound.',
   array[
     'Featuring a genuine leather head strap and premium earcups, these headphones deliver superior comfort for endless listening. It includes intuitive controls designed for any situation.',
     'The advanced Active Noise Cancellation with built-in equalizer lets you experience your audio world on your terms. Combined with Bluetooth 5.0, 17 hour battery life and a modern design aesthetic.'
   ],
   array['XX99 Mark II Headphones', '3.5mm audio cable', 'USB-C charging cable', 'Carry case', 'User guide'],
   true, 'mist'),

  ('p-xx99-mark-i', 'xx99-mark-i-headphones', 'XX99 Mark I Headphones', 'headphones', 1750,
   'As the gold standard for headphones, the classic XX99 Mark I offers detailed and accurate audio reproduction for audiophiles, mixing engineers, and music aficionados alike in studios and on the go.',
   array[
     'As the headphones all others are measured against, the XX99 Mark I demonstrates over five decades of audio expertise, redefining the critical listening experience.',
     'From handcrafted microfiber ear cushions to the robust metal headband with inner damping element, the components work together to deliver comfort and uncompromising sound.'
   ],
   array['XX99 Mark I Headphones', '3.5mm audio cable', 'Protective case', 'User guide'],
   false, 'mist'),

  ('p-xx59-headphones', 'xx59-headphones', 'XX59 Headphones', 'headphones', 899,
   'The XX59 delivers a warm, generous soundstage in a lighter, more compact shell - the perfect everyday pair that still sounds like a studio reference.',
   array[
     'A 40mm bio-cellulose driver keeps the midrange natural and the treble unfatiguing for long sessions.',
     'Folding aluminium hinges and a 1.4m coiled cable make it a reliable travel companion.'
   ],
   array['XX59 Headphones', '1.4m coiled cable', 'Airline adapter', 'User guide'],
   false, 'mist'),

  ('p-zx9-speaker', 'zx9-speaker', 'ZX9 Speaker', 'speakers', 2499,
   'Upgrade to premium speakers that are phenomenally built to deliver truly remarkable sound. A two-way design with a silk-dome tweeter and a long-throw woofer.',
   array[
     'Hand-matched drivers are paired and measured in our Brooklyn workshop before shipping.',
     'The sealed cabinet is internally braced with layered MDF to eliminate resonance at any volume.'
   ],
   array['ZX9 Speaker', 'Power cable', 'Speaker grille', 'Cinch bag'],
   true, 'mist'),

  ('p-zx7-speaker', 'zx7-speaker', 'ZX7 Speaker', 'speakers', 1299,
   'A bookshelf monitor that punches well above its weight. The ZX7 is the gateway to a real hi-fi system for smaller rooms and desktop setups.',
   array[
     'A 5.25in woven woofer with a rigid cast aluminium basket delivers tight, articulate bass.',
     'Sold as a single speaker so you can build a stereo pair at your own pace.'
   ],
   array['ZX7 Speaker', 'Speaker grille', 'Cinch bag'],
   false, 'mist'),

  ('p-yx1-earphones', 'yx1-wireless-earphones', 'YX1 Wireless Earphones', 'earphones', 599,
   'Truly wireless earphones with an 8mm dynamic driver, IPX5 water resistance and a pocketable charging case that adds 24 hours of playback.',
   array[
     'Low-latency game mode keeps audio in sync with what you see on screen.',
     'Four silicone tip sizes and an in-line mic for calls that cut through street noise.'
   ],
   array['YX1 Earbuds', 'Charging case', '4 ear tip sizes', 'USB-C cable'],
   false, 'ink'),

  ('p-yx2-earphones', 'yx2-wireless-earphones', 'YX2 Wireless Earphones', 'earphones', 749,
   'Our flagship earphones add adaptive ANC and a wireless-charging case to the YX1 formula, for commutes where the world needs to go away.',
   array[
     'Adaptive ANC measures the seal in your ear 200 times a second and adjusts depth automatically.',
     'Wireless charging case with 32 hours of total playback and an LED battery readout.'
   ],
   array['YX2 Earbuds', 'Wireless charging case', '4 ear tip sizes', 'USB-C cable'],
   true, 'ink'),

  ('p-yx3-earphones', 'yx3-earphones', 'YX3 Studio Earbuds', 'earphones', 1099,
   'Reference-grade earphones tuned with our mastering engineers - the same voicing we use on our full-size monitors.',
   array[
     'Hybrid driver array with a dedicated high-frequency tweeter for detail retrieval.',
     'Studio-grade memory foam tips passively isolate up to 18dB before ANC engages.'
   ],
   array['YX3 Earbuds', 'Studio case', 'Memory foam tips', 'USB-C cable'],
   true, 'ink')

on conflict (id) do update set
  slug        = excluded.slug,
  name        = excluded.name,
  category    = excluded.category,
  price       = excluded.price,
  description = excluded.description,
  features    = excluded.features,
  in_the_box  = excluded.in_the_box,
  is_new      = excluded.is_new,
  accent      = excluded.accent;

-- ---------------------------------------------------------------------------
-- Sanity check: should return 8 once the seed above has run.
-- ---------------------------------------------------------------------------
select count(*) as product_count from public.products;
