/**
 * Cornubia Flats delivery eligibility helpers.
 * Boundary rules come from DeliveryZone.boundaryJson / suburb matching —
 * administrators configure the zone; this logic does not hard-code live coverage claims.
 */

export type AddressInput = {
  line1: string;
  suburb: string;
  city?: string;
  building?: string | null;
  unitNumber?: string | null;
};

export type ZoneBoundary = {
  type?: string;
  allowedSuburbs?: string[];
  note?: string;
};

export function parseZoneBoundary(boundaryJson: string | null | undefined): ZoneBoundary {
  if (!boundaryJson) {
    return { allowedSuburbs: ["cornubia", "cornubia flats"] };
  }
  try {
    return JSON.parse(boundaryJson) as ZoneBoundary;
  } catch {
    return { allowedSuburbs: ["cornubia", "cornubia flats"] };
  }
}

export function isAddressInServiceArea(
  address: AddressInput,
  boundaryJson?: string | null,
): boolean {
  const boundary = parseZoneBoundary(boundaryJson);
  const suburbs = (boundary.allowedSuburbs ?? ["cornubia", "cornubia flats"]).map((s) =>
    s.toLowerCase(),
  );
  const haystack = `${address.suburb} ${address.line1} ${address.city ?? ""}`.toLowerCase();
  return suburbs.some((s) => haystack.includes(s));
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
