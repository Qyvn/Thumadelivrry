# Merchant onboarding (Day 2)

## Flow
1. **Apply** — `/merchant/apply` (public). Business name, owner, phone + WhatsApp (SA numbers,
   normalised to +27…), email + password (becomes the merchant login), category
   (Restaurant → `FOOD`, Grocery → `GROCERY`, Retail → `RETAIL`), independent yes/no, address,
   map pin (lat/lng typed, browser geolocation, OpenStreetMap preview — no paid map APIs),
   opening hours per day, optional logo (PNG/JPEG/WebP ≤ 300 KB, stored inline as a data URL).
   Validation: `src/lib/onboarding.ts` (zod). One pending application per email.
2. **Review** — `/admin/merchants` (ADMIN only). Approve or reject with notes (notes required to reject).
   Approval (`approveApplication` in `src/lib/merchant-onboarding.ts`) in one transaction:
   creates/links a `MERCHANT_STAFF` user with the applicant's password, creates the `Merchant`
   (status `APPROVED`, `pricingCategory`, `isIndependent`, pin, hours, logo, launch zone,
   `isDevSample = false`) and sets `introRateStartedAt = approval time` for independents.
   The intro rate itself (default 12% for 3 months) comes from pricing settings.
   Rejection clears the stored password hash; no account is created.
3. **Catalogue** — `/merchant/catalogue` (merchant staff: own merchant only; admin: `?merchantId=`).
   Add/edit products (name, price, description, image ≤ 300 KB, availability, aisle).
   CSV bulk upload with template at `/merchant/catalogue/template.csv`
   (`name,price,description,available,aisle`); rows matching an existing name update it;
   any invalid row aborts the whole import with row-level errors.
4. **Customers** see the shop at `/shops/<slug>` and in nearby/search once it is approved and has active products.

## Admin reporting
`/admin/merchants` also shows each merchant's commission rate **in effect today** (with reason:
intro / restaurant / grocery-retail / override, and intro end date), order count, item sales,
Duban commission and merchant net (from `MerchantCommission`), plus a courier payouts summary
(from `CourierEarning`: deliveries, tips, owed vs settled). No money is moved automatically.

## Peak-fee schedule
`/admin/settings/pricing#peak`: windows of days + HH:MM range in Africa/Johannesburg, stored as
`PlatformSettings.peakWindowsJson`. Peak fee is charged when "Peak fee enabled" is on **and**
either no windows exist or the order time falls in a window. End ≤ start means overnight.
Logic: `src/lib/peak.ts`, `isPeakActive` in `src/lib/pricing.ts`.

## Tests
- `src/lib/onboarding.test.ts` — validation, CSV, hours, images, intro rate, peak windows.
- `scripts/onboarding-flow.test.ts` — DB flow incl. access control (in `npm test`; also verified on Postgres 17).
- `scripts/onboarding-e2e.mjs` — Playwright browser test, needs a running app:
  `THUMA_URL=http://localhost:3456 npm run test:e2e:onboarding`; writes `screenshots/onboarding-*.png`.

Note: if a shell has a non-`file:` `DATABASE_URL` exported, the SQLite tests/`THUMA_USE_TMP_DB` won't be used — unset it first.
