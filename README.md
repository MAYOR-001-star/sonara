# Sonora — Audio Store

An all-in-one storefront for headphones, speakers and earphones, built with the
Next.js App Router. The catalog is served from Postgres, and the app falls back to
a bundled seed catalog so the store is fully browsable without any backend.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **React 19** / **TypeScript**
- **Tailwind CSS v4** (PostCSS plugin, no `tailwind.config.js` needed)
- **Supabase** — Postgres for `products` / `orders` + Google OAuth
- **Zustand** — client-side cart state
- **Mailgun** — order confirmation emails

## Requirements

- Node.js 20+
- A Postgres database (Supabase, Neon, Railway, or local) — **required to
  checkout**, because RLS enforces order ownership there
- Google OAuth credentials — required to sign in, and therefore to check out
- A verified Mailgun domain — optional, only for confirmation emails

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in whatever you need; the rest can stay blank
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The catalogue is browsable with no credentials at all: the app falls back to the
in-memory catalog in `src/lib/seed-products.ts`. **Checkout is not** — it
requires Supabase plus a signed-in user, since ownership is enforced in the
database. With no Supabase configured the protected routes are left open rather
than walled off, so local UI work is not blocked by an auth wall that can never
be satisfied.

## Environment variables

See [`.env.example`](./.env.example) for the full annotated list.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe to expose; RLS guards the data) |
| `SUPABASE_DB_PASSWORD` | Used to run `supabase/schema.sql` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth web client |
| `GOOGLE_CLIENT_SECRET` | Server-only OAuth secret |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` | Order email delivery |
| `MAILGUN_FROM` | Verified sender address |
| `NEXT_PUBLIC_SITE_URL` | Absolute base URL, used in auth redirects and emails |
| `NEXT_PUBLIC_CURRENCY` | Display currency (default `USD`) |
| `SHIPPING_FLAT_RATE` | Flat shipping charge in minor units |

There is intentionally **no `SUPABASE_SERVICE_ROLE_KEY`**. It is not used by this
app, and it bypasses RLS entirely — a leaked service-role key hands over the
whole database. Order writes use the anon key plus the signed-in user's cookie,
and row-level security enforces ownership.

Never commit `.env.local` — it is already in `.gitignore`. If a real key has
ever been pasted into a chat, issue, or commit, rotate it in the Supabase
dashboard; deleting the commit is not enough.

## Authentication and access control

**Checkout requires a signed-in user.** Guests cannot order. This is what lets
every order carry a `user_id`, and therefore what lets RLS guarantee that a
customer can read only their own order.

The storefront stays browsable without an account: home, category and product
pages are public.

| Route | Access |
| --- | --- |
| `/`, `/category/*`, `/product/*` | Public |
| `/login`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy` | Public |
| `/checkout`, `/account`, `/orders/*`, `/order-success` | **Sign-in required** |
| `POST /api/checkout` | **Sign-in required** (401 JSON) |

Enforcement is layered, so no single mistake exposes order data:

1. **Middleware** (`src/proxy.ts`) redirects unauthenticated page requests to
   `/login?next=…`, and returns a JSON `401` for API routes rather than an HTML
   page.
2. **Route handler** (`src/app/api/checkout/route.ts`) re-checks the session
   before writing. Middleware alone is not a security boundary — the route is
   reachable directly.
3. **Row-level security** in Postgres is the real guarantee. It holds even
   against a direct PostgREST call with the anon key.

`getOrder()` additionally filters on `user_id`, so the app cannot render another
customer's address even if a policy were ever stale.

### Rate limiting

`POST /api/checkout` allows **5 requests per minute per IP** and returns `429`
past that. It is checked before any work, which stops the endpoint being used to
flood the `orders` table or burn through the Mailgun sending quota.

The limiter is in-memory and per-process (`src/lib/rate-limit.ts`). On a
single Node host that is exactly 5/min; on serverless or a multi-instance
deployment the effective ceiling is `5 × instances`. Move the counter to Redis if
you scale out.

> **Deploying on serverless?** Consider Supabase Edge Rate Limiting or Upstash
> Redis instead, so the limit holds globally rather than per instance.

## Database setup

Open your database (Supabase → SQL Editor → New query → Run, or `psql`).

For a **fresh install**, run these in order:

| Script | Purpose |
| --- | --- |
| `supabase/setup-all.sql` | Tables, indexes, RLS policies and grants in one pass |
| `supabase/seed.sql` | The starter catalogue (8 products) |

`setup-all.sql` is the one to use. It is idempotent — safe to re-run — and it
already contains the current policies, including the `order_items` INSERT policy
and the sign-in-required rules.

<details>
<summary>Migrations for an existing database</summary>

If you already deployed an earlier version, run the targeted scripts instead.
Each is idempotent.

| Script | Purpose |
| --- | --- |
| `supabase/grant.sql` | Table grants. Without these PostgREST fails with `42501 permission denied` — enabling RLS alone is not enough |
| `supabase/fix-order-items.sql` | Adds the missing `order_items` INSERT policy. Without it the order row saves but the line items fail, surfacing as "We couldn't save your order." |
| `supabase/require-login-checkout.sql` | Retires guest checkout: drops the permissive "read recent guest orders" policy and requires `auth.uid()` on writes |
| `supabase/cleanup-probe-orders.sql` | Deletes local test orders. Optional |

</details>

**Why orders are owner-scoped.** A guest order has `user_id is null`, so it cannot
be protected by an owner-scoped policy. That previously forced a blanket rule
letting anyone read any guest order — including name, email and shipping address
— for 24 hours if they knew the `AP-XXXXXX` reference. Requiring sign-in at
checkout means every order has an owner and the permissive rule is unnecessary.

Verify with:

```sql
select tablename, policyname, cmd from pg_policies
where schemaname = 'public' and tablename in ('orders','order_items')
order by tablename, cmd, policyname;
```

Expect only `signed-in users create orders`, `users read own orders`,
`signed-in users create order items` and `users read own order items`. Any
`anyone can …` row is a leftover.

## Project structure

```
src/
  app/                  routes and API handlers
    api/checkout/       order creation (POST, sign-in required)
    auth/callback/      OAuth redirect handler
    category/[category] listing pages
    product/[slug]      product detail
    checkout/           cart + shipping form (sign-in required)
    order-success/      post-purchase confirmation (sign-in required)
    orders/[orderId]    order receipt, owner-scoped (sign-in required)
    account/            order history (sign-in required)
    login/              sign in / sign up
    forgot-password/    password reset request
    reset-password/     password reset form
    privacy/ terms/     legal pages
    not-found.tsx       404 (full-screen, no site chrome)
  components/           Header, Footer, CartDrawer, product/cart UI
  lib/
    supabase/           browser + server clients, session refresh
    catalog.ts          DB-backed catalog with seed fallback
    orders.ts           order creation and owner-scoped lookup
    auth-actions.ts     sign in / sign out server actions
    rate-limit.ts       in-memory fixed-window limiter + client IP
    mailgun.ts          order email sender
  store/cart-store.ts   Zustand cart
  proxy.ts              route gate + Supabase session refresh
supabase/               schema, seed, setup and migration SQL
```

## Routes that skip the site chrome

`StoreChrome` renders the header, footer and cart drawer for every route except
`/login`, which is listed in `BARE_ROUTES`. The 404 page is a full-screen overlay
so it also hides the header and footer.

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
npx tsc --noEmit # type check
```

## Testing the store

There is no automated test suite. Check the following after any change to auth,
checkout or the SQL scripts.

```bash
npm run dev
```

**Public pages** — should return `200`:

```
/  /category/headphones  /category/speakers  /category/earphones
/product/xx99-mark-ii-headphones  /login  /terms  /privacy
```

**Protected pages** — should return `307` to `/login?next=…` while signed out:

```
/checkout  /account  /orders/AP-XXXXXX  /order-success
```

**Checkout** — sign in, add to cart, complete an order. Then confirm the order
appears under `/account`, that `/order-success` lists the line items, and that
`/orders/AP-XXXXXX` shows the shipping address.

**Cross-account leak** — the important one. Note an order reference while
signed in, sign out, and request the same URL. It must redirect to `/login`, not
render the address.

**Rate limit** — six rapid `POST /api/checkout` requests; the sixth should be
`429`. Note this only counts requests that reach the handler, so signed-out calls
will return `401` and not consume the budget.

**Database** — confirm RLS is not bypassable with the anon key:

```bash
curl -s "https://<project>.supabase.co/rest/v1/orders?select=order_id" \
  -H "apikey: <anon-key>" -H "Authorization: Bearer <anon-key>"
```

Must return `[]`, never order rows. The `products` table should still return 8.

## Deploying

Deploy to Vercel or any Node host. Set the same environment variables in the
host's dashboard, and update the Google OAuth redirect URIs and
`NEXT_PUBLIC_SITE_URL` to your production domain.

Before going live:

- [ ] Rotate every credential that has been shared in a chat, issue or commit —
      Supabase keys, `SUPABASE_DB_PASSWORD`, `GOOGLE_CLIENT_SECRET`, `MAILGUN_API_KEY`.
- [ ] Use Supabase **Edge Rate Limiting** if deploying serverless, so the checkout
      limit holds across instances.
- [ ] Confirm email confirmation and redirect URLs allow your production domain.
- [ ] Review `/terms` and `/privacy` — they still describe guest checkout and
      quote `privacy@sonora.com` / `legal@sonora.com`, which are placeholders.

