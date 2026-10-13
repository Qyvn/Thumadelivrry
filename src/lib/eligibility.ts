/**
 * Delivery eligibility helpers.
 * Service area is driven by DeliveryZone.boundaryJson (radius around a centre,
 * plus optional city/suburb allowlists). Administrators configure coverage —
 * this logic does not hard-code live launch claims.
 */

import { distanceKm, parseZoneGeo, type LatLng } from "./geo";
import { DEFAULT_DURBAN_CITIES } from "./zones-constants";

export type AddressInput = {
  line1: string;
  suburb: string;
  city?: string;
  building?: string | null;
  unitNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ZoneBoundary = {
  type?: string;
  center?: LatLng;
  radiusKm?: number;
  allowedSuburbs?: string[];
  allowedCities?: string[];
  note?: string;
};

export function parseZoneBoundary(
  boundaryJson: string | null | undefined,
): ZoneBoundary {
  const geo = parseZoneGeo(boundaryJson);
  return {
    type: geo.type,
    center: geo.center,
    radiusKm: geo.radiusKm,
    allowedSuburbs: geo.allowedSuburbs,
    allowedCities: (geo as ZoneBoundary).allowedCities,
    note: geo.note,
  };
}

function haystackIncludes(
  haystack: string,
  needles: string[] | undefined,
): boolean {
  if (!needles?.length) return false;
  return needles.some((n) => haystack.includes(n.toLowerCase()));
}

/**
 * True when the address is inside the configured Durban (or other) delivery area.
 * Prefers lat/lng distance to the zone centre; falls back to city/suburb allowlists
 * when coordinates are not set yet (so you can fill pins later).
 */
export function isAddressInServiceArea(
  address: AddressInput,
  boundaryJson?: string | null,
): boolean {
  const boundary = parseZoneBoundary(boundaryJson);
  const center = boundary.center;
  const radiusKm = boundary.radiusKm ?? 40;

  if (
    typeof address.latitude === "number" &&
    typeof address.longitude === "number" &&
    center
  ) {
    return (
      distanceKm(
        { lat: address.latitude, lng: address.longitude },
        center,
      ) <= radiusKm
    );
  }

  const haystack =
    `${address.suburb} ${address.line1} ${address.city ?? ""}`.toLowerCase();

  const cities = boundary.allowedCities?.length
    ? boundary.allowedCities
    : [...DEFAULT_DURBAN_CITIES];
  const suburbs = boundary.allowedSuburbs ?? [];

  // Text fallback until you set lat/lng on the address
  return haystackIncludes(haystack, cities) || haystackIncludes(haystack, suburbs);
}

/** Merchandise subtotal must meet this before a delivery order can be placed. */
export function meetsMinimumOrder(
  itemTotalCents: number,
  minOrderCents: number,
): { ok: boolean; shortfallCents: number; minOrderCents: number } {
  if (minOrderCents < 0) throw new Error("Minimum order cannot be negative");
  const shortfallCents = Math.max(0, minOrderCents - itemTotalCents);
  return {
    ok: itemTotalCents >= minOrderCents,
    shortfallCents,
    minOrderCents,
  };
}

export function basketLineTotal(unitPriceCents: number, quantity: number): number {
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
    throw new Error("Invalid unit price");
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Invalid quantity");
  }
  return unitPriceCents * quantity;
}

export function computeOrderTotals(params: {
  itemTotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  discountCents?: number;
}) {
  const discount = params.discountCents ?? 0;
  if (
    params.itemTotalCents < 0 ||
    params.deliveryFeeCents < 0 ||
    params.serviceFeeCents < 0 ||
    discount < 0
  ) {
    throw new Error("Fees and totals cannot be negative");
  }
  if (discount > params.itemTotalCents + params.deliveryFeeCents + params.serviceFeeCents) {
    throw new Error("Discount cannot exceed payable amount");
  }
  return {
    itemTotalCents: params.itemTotalCents,
    deliveryFeeCents: params.deliveryFeeCents,
    serviceFeeCents: params.serviceFeeCents,
    discountCents: discount,
    totalCents:
      params.itemTotalCents +
      params.deliveryFeeCents +
      params.serviceFeeCents -
      discount,
  };
}
