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
- A Postgres database (Supabase, Neon, Railway, or local) — optional
- Google OAuth credentials — optional
- A verified Mailgun domain — optional

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in whatever you need; the rest can stay blank
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Every integration is optional. Without credentials the app uses the in-memory
catalog in `src/lib/seed-products.ts` and shows a friendly message instead of a
sign-in button that cannot work.

## Environment variables

See [`.env.example`](./.env.example) for the full annotated list.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for order writes |
| `SUPABASE_DB_PASSWORD` | Used to run `supabase/schema.sql` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth web client |
| `GOOGLE_CLIENT_SECRET` | Server-only OAuth secret |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` | Order email delivery |
| `MAILGUN_FROM` | Verified sender address |
| `NEXT_PUBLIC_SITE_URL` | Absolute base URL, used in auth redirects and emails |
| `NEXT_PUBLIC_CURRENCY` | Display currency (default `USD`) |
| `SHIPPING_FLAT_RATE` | Flat shipping charge in minor units |

Never commit `.env.local` — it is already in `.gitignore`.

## Database setup

1. Open your database (Supabase → SQL Editor, or `psql`).
2. Run `supabase/schema.sql`, then `supabase/seed.sql`.

`schema.sql` creates `public.products` and `public.orders` plus indexes, and works
on any standard Postgres host. `seed.sql` loads the starter catalog.

## Project structure

```
src/
  app/                  routes and API handlers
    api/checkout/       order creation (POST)
    auth/callback/      OAuth redirect handler
    category/[category] listing pages
    product/[slug]      product detail
    checkout/           cart + shipping form
    order-success/      post-purchase confirmation
    orders/[orderId]    order lookup for a signed-in user
    not-found.tsx       404 (full-screen, no site chrome)
  components/           Header, Footer, CartDrawer, product/cart UI
  lib/
    supabase/           browser + server clients, session refresh
    catalog.ts          DB-backed catalog with seed fallback
    orders.ts           order creation and lookup
    auth-actions.ts     sign in / sign out server actions
    mailgun.ts          order email sender
  store/cart-store.ts   Zustand cart
  proxy.ts              refreshes the Supabase session on every request
supabase/               schema.sql, seed.sql
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

## Deploying

Deploy to Vercel or any Node host. Set the same environment variables in the
host's dashboard, and update the Google OAuth redirect URIs and
`NEXT_PUBLIC_SITE_URL` to your production domain.

