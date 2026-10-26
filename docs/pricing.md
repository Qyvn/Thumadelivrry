# Pricing model (approved for build)

All values live in `PlatformSettings` (DB) and are editable by an ADMIN at
`/admin/settings/pricing`. Code defaults in `src/lib/pricing.ts` (`DEFAULT_PRICING`)
mirror the Prisma schema defaults and are only used if the settings row is missing.
Money is integer ZAR cents. Placed orders keep an immutable snapshot (`Order.pricingJson`
plus fee columns), so later setting changes never re-price old orders.

| Rule | Default | Settings fields |
| --- | --- | --- |
| Delivery by distance | R19 ≤3 km, R25 ≤6 km, R32 ≤10 km, then +R3 per started km, cap R45 | `deliveryBand*`, `deliveryPerKmBeyondCents`, `deliveryFeeCapCents` |
| Service fee | R5, waived when items subtotal > R400 | `serviceFeeCents`, `serviceFeeWaiverOverCents` |
| Small-order fee | R10 when items subtotal < R100 | `smallOrderFeeCents`, `smallOrderUnderCents` |
| Minimum order | R60 food, R100 grocery/retail (by `Merchant.pricingCategory`) | `minOrderFoodCents`, `minOrderGroceryCents` |
| Commission | Restaurants 15%, grocery/retail 8%, pickup 5%; intro 12% for 3 months for independents (only if lower than default) | `commission*Bps`, `introCommission*`; per-merchant override `Merchant.commissionBps` (null = default), `Merchant.isIndependent`, `Merchant.introRateStartedAt` |
| Courier pay | R25 base (covers 3 km) + R3 per started km after, R12 per extra batched drop, tips 100% to courier, peak fee 100% to courier | `courier*` |
| Peak fee | R5, **off** by default | `peakFeeEnabled`, `peakFeeCents` |
| THUMA Plus | R59/month; no service fee; free delivery ≤6 km for food > R150 / grocery > R250 | `plus*`; `PlusSubscription` model |

## Distance estimate
`estimateDistance()` in `src/lib/pricing.ts`, in order of preference:
1. **HAVERSINE** – straight-line km between merchant and delivery address coordinates.
2. **ZONE_CENTER** – merchant has no pin: straight-line from the delivery zone centre (`DeliveryZone.boundaryJson.center`).
3. **FALLBACK** – address has no pin: `fallbackDistanceKm` (default 5 km → R25 band).

Distances are rounded **up** to 0.1 km. Straight-line distance under-estimates road
distance (typically ×1.2–1.4 in Durban); swap in a routing API (Google/Mapbox/OSRM)
later by changing only `estimateDistance()`.

## Not yet implemented
- **Billing for THUMA Plus**: `PlusSubscription.billingStatus = NOT_YET_BILLED`. Members get
  benefits but are not charged; UI says so. Wire to a PayFast/Yoco subscription before charging.
- **Pickup orders** and **batched deliveries**: the pricing functions support them
  (`fulfilment: "PICKUP"`, `extraDrops`), but the order flow is delivery-only and single-drop.
- **Peak-time schedule**: the peak fee is a manual admin toggle.
