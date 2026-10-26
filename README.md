# THUMA

**You need it. We bring it.**

African-born South African everything-delivery platform. Operating area: **Greater Durban** (configurable radius around Durban CBD), KwaZulu-Natal.

This repository is a functional Stage 1–4 foundation: customer ordering, merchant acceptance, courier delivery, and admin monitoring on a shared backend — not a production launch claim.

## Brand

| Token | Value |
| --- | --- |
| Name | THUMA |
| Tagline | You need it. We bring it. |
| Charcoal green | `#18221B` |
| Lime | `#D0F27B` |
| Cream background | `#F5F0E6` |

Do not change the name, tagline, or core colours without approval.

## Stack

- **Frontend / API:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Database:** Prisma + SQLite locally (swap `DATABASE_URL` to PostgreSQL for staging/production)
- **Auth:** HTTP-only session cookies + bcrypt password hashes + role-based access
- **Payments:** Mock PayFast-shaped provider — orders only confirm after a **server-side** payment callback simulation (never from a browser success redirect alone)

## Interfaces

| Surface | Path | Purpose |
| --- | --- | --- |
| Customer | `/` | Location, Eats, Market, search, basket, checkout, tracking |
| Merchant | `/merchant` | Accept/reject/prepare orders, view catalogue |
| Courier | `/courier` | Claim jobs, pickup, deliver with proof |
| Admin | `/admin` | Durban metrics, applications, dispatch/refunds |
| Shop backlog | `/admin/shops` | Reserve real shops; upload names, menus, and stock (draft until published) |

## Publish to the web (Cursor)

No GitHub required:

1. In this Cloud Agent chat, click **Create repo** (above the input) → name it `thuma-delivery` → create the Origin repo.
2. Connect **Vercel** if prompted (**Add Vercel**).
3. Click **Publish**.

Cursor deploys the default branch and returns a public URL. The Vercel deploy uses a seeded SQLite snapshot (`data/demo.db`) copied to `/tmp` for demos. For a durable production DB, set `DATABASE_URL` to PostgreSQL on the Vercel project and switch the Prisma provider.

## Quick start (local)

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3456](http://localhost:3456).

### Demo accounts

Password for all: `thuma-demo-2026`

| Email | Role |
| --- | --- |
| `customer@thuma.local` | Customer |
| `merchant@thuma.local` | Merchant staff |
| `courier@thuma.local` | Courier |
| `admin@thuma.local` | Admin |

Seeded merchants and products are **DEVELOPMENT SAMPLE** data. They are not confirmed live partners.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server on port **3456** |
| `npm run build` | Production build |
| `npm run db:seed` | Reseed development data |
| `npm run test:unit` | Order lifecycle unit checks |

## Architecture notes

- Money is stored in **ZAR cents** (integers).
- Order status transitions are validated by a server-side state machine (`src/lib/order-lifecycle.ts`).
- Order line items snapshot name/price at checkout so catalogue edits do not rewrite history.
- Inventory ownership distinguishes `MERCHANT` vs `THUMA` stock.
- Delivery zones, fees, commissions, and courier flat fees are configurable via `DeliveryZone` / `PlatformSettings`.
- **Greater Durban radius:** customers can order anywhere inside the zone `radiusKm` around the Durban centre (default 40 km); nearest stores use the same radius from the delivery pin. Admins change the radius in `/admin`; set address/merchant lat/lng when you update locations.
- **Minimum order:** deliveries require an item subtotal of at least **R200** (`PlatformSettings.minOrderCents`); under that, checkout is blocked.
- Service categories include Eats + Market (enabled) and Local + Express (schema-ready, disabled).

## Integrations requiring credentials

Documented in `.env.example`. Not wired for live traffic yet:

- Real SA payment gateway (PayFast / Peach / Ozow)
- Object storage for merchant documents and product photos
- Maps / address validation provider
- SMS / email / push notifications

## Honest status

**Working in this build:** auth + roles, Greater Durban radius zone, sample catalogue browse, basket, checkout with mock payment callback, merchant accept/prepare, courier claim/deliver, live order status refresh on the customer tracking page, admin metrics + manual dispatch + refunds, audit events.

**Not production-ready:** real payment capture, POPIA compliance programme, SMS/push, automated dispatch algorithms, multi-zone live launch, legal merchant agreements, load/security hardening at scale.

## Licence

Private — THUMA project.

## GitHub Pages (static landing site)

The full app needs a Node server + database, so it cannot run on GitHub Pages.
A static brand/landing site lives in `site/` and is deployed by `.github/workflows/pages.yml`
to https://qyvn.github.io/Thumadelivrry/. Contact details there are marked `[PLACEHOLDER]` until provided.

Local run of the full app: `DATABASE_URL=file:/abs/path/to/copy-of-data/demo.db npm run build && npm start`
