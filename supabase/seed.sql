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
