/**
 * Duban / THUMA pricing engine — pure functions, no DB access.
 * Every number comes from a PricingConfig (loaded from PlatformSettings in the DB
 * and editable at /admin/settings/pricing). DEFAULT_PRICING mirrors the Prisma
 * schema defaults and is only used when the settings row is missing.
 * All money is integer ZAR cents. See docs/pricing.md.
 */

import { distanceKm, type LatLng } from "./geo";
import { isInPeakWindow, parsePeakWindows, type PeakWindow } from "./peak";

export type PricingCategory = "FOOD" | "GROCERY" | "RETAIL";
export type Fulfilment = "DELIVERY" | "PICKUP";
export type DistanceSource = "HAVERSINE" | "ZONE_CENTER" | "FALLBACK";

export type PricingConfig = {
  deliveryBand1MaxKm: number;
  deliveryBand1Cents: number;
  deliveryBand2MaxKm: number;
  deliveryBand2Cents: number;
  deliveryBand3MaxKm: number;
  deliveryBand3Cents: number;
  deliveryPerKmBeyondCents: number;
  deliveryFeeCapCents: number;
  fallbackDistanceKm: number;
  serviceFeeCents: number;
  serviceFeeWaiverOverCents: number;
  smallOrderFeeCents: number;
  smallOrderUnderCents: number;
  minOrderFoodCents: number;
  minOrderGroceryCents: number;
  peakFeeEnabled: boolean;
  peakFeeCents: number;
  commissionRestaurantBps: number;
  commissionGroceryBps: number;
  commissionPickupBps: number;
  introCommissionEnabled: boolean;
  introCommissionBps: number;
  introCommissionMonths: number;
  courierBaseCents: number;
  courierPerKmCents: number;
  courierBaseCoversKm: number;
  courierBatchDropCents: number;
  plusEnabled: boolean;
  plusMonthlyPriceCents: number;
  plusFreeDeliveryMaxKm: number;
  plusFoodMinCents: number;
  plusGroceryMinCents: number;
  /** Scheduled peak windows (SAST). Empty = peak fee applies whenever enabled. */
  peakWindows: PeakWindow[];
};

export const DEFAULT_PRICING: PricingConfig = {
  deliveryBand1MaxKm: 3,
  deliveryBand1Cents: 1900,
  deliveryBand2MaxKm: 6,
  deliveryBand2Cents: 2500,
  deliveryBand3MaxKm: 10,
  deliveryBand3Cents: 3200,
  deliveryPerKmBeyondCents: 300,
  deliveryFeeCapCents: 4500,
  fallbackDistanceKm: 5,
  serviceFeeCents: 500,
  serviceFeeWaiverOverCents: 40000,
  smallOrderFeeCents: 1000,
  smallOrderUnderCents: 10000,
  minOrderFoodCents: 6000,
  minOrderGroceryCents: 10000,
  peakFeeEnabled: false,
  peakFeeCents: 500,
  commissionRestaurantBps: 1500,
  commissionGroceryBps: 800,
  commissionPickupBps: 500,
  introCommissionEnabled: true,
  introCommissionBps: 1200,
  introCommissionMonths: 3,
  courierBaseCents: 2500,
  courierPerKmCents: 300,
  courierBaseCoversKm: 3,
  courierBatchDropCents: 1200,
  plusEnabled: true,
  plusMonthlyPriceCents: 5900,
  plusFreeDeliveryMaxKm: 6,
  plusFoodMinCents: 15000,
  plusGroceryMinCents: 25000,
  peakWindows: [],
};

export const PRICING_KEYS = (Object.keys(DEFAULT_PRICING) as (keyof PricingConfig)[]).filter(
  (k) => k !== "peakWindows",
);

/** Pick pricing fields from a PlatformSettings row (or null) with defaults. */
export function pricingFromSettings(
  row: (Partial<Record<keyof PricingConfig, unknown>> & { peakWindowsJson?: string | null }) | null | undefined,
): PricingConfig {
  const out = { ...DEFAULT_PRICING, peakWindows: parsePeakWindows(row?.peakWindowsJson) } as Record<
    string,
    unknown
  >;
  if (row) {
    for (const key of PRICING_KEYS) {
      const v = row[key];
      if (typeof v === typeof DEFAULT_PRICING[key]) out[key] = v;
    }
  }
  return out as PricingConfig;
}

/** Peak fee is charged when enabled and (no windows scheduled, or `now` is inside one). */
export function isPeakActive(config: PricingConfig, now: Date = new Date()): boolean {
  if (!config.peakFeeEnabled) return false;
  if (!config.peakWindows || config.peakWindows.length === 0) return true;
  return isInPeakWindow(config.peakWindows, now);
}

export function normalisePricingCategory(value: string | null | undefined): PricingCategory {
  const v = (value ?? "").toUpperCase();
  if (v === "GROCERY" || v === "MARKET") return "GROCERY";
  if (v === "RETAIL") return "RETAIL";
  return "FOOD";
}

/** Round distance up to 0.1 km so the customer quote is stable and never under-charged. */
function roundKm(km: number): number {
  return Math.ceil(km * 10 - 1e-9) / 10;
}

export function estimateDistance(params: {
  merchant?: Partial<LatLng> | null;
  customer?: Partial<LatLng> | null;
  zoneCenter?: LatLng | null;
  config: PricingConfig;
}): { km: number; source: DistanceSource } {
  const c = params.customer;
  const m = params.merchant;
  const hasC = c?.lat != null && c?.lng != null;
  if (hasC && m?.lat != null && m?.lng != null) {
    return {
      km: roundKm(distanceKm({ lat: m.lat, lng: m.lng }, { lat: c!.lat!, lng: c!.lng! })),
      source: "HAVERSINE",
    };
  }
  if (hasC && params.zoneCenter) {
    return {
      km: roundKm(distanceKm(params.zoneCenter, { lat: c!.lat!, lng: c!.lng! })),
      source: "ZONE_CENTER",
    };
  }
  return { km: params.config.fallbackDistanceKm, source: "FALLBACK" };
}

/** Distance-banded delivery fee: band1/band2/band3, then +per km beyond band3 (part-km rounds up), capped. */
export function deliveryFeeForDistance(km: number, config: PricingConfig): number {
  if (!Number.isFinite(km) || km < 0) throw new Error("Invalid distance");
  if (km <= config.deliveryBand1MaxKm) return config.deliveryBand1Cents;
  if (km <= config.deliveryBand2MaxKm) return config.deliveryBand2Cents;
  if (km <= config.deliveryBand3MaxKm) return config.deliveryBand3Cents;
  const extraKm = Math.ceil(km - config.deliveryBand3MaxKm - 1e-9);
  return Math.min(
    config.deliveryFeeCapCents,
    config.deliveryBand3Cents + extraKm * config.deliveryPerKmBeyondCents,
  );
}

export function minimumOrderCents(category: PricingCategory, config: PricingConfig): number {
  return category === "FOOD" ? config.minOrderFoodCents : config.minOrderGroceryCents;
}

export function commissionBps(params: {
  category: PricingCategory;
  fulfilment?: Fulfilment;
  overrideBps?: number | null;
  isIndependent?: boolean;
  introRateStartedAt?: Date | null;
  now?: Date;
  config: PricingConfig;
}): { bps: number; reason: string } {
  const { config } = params;
  if (params.overrideBps != null) return { bps: params.overrideBps, reason: "MERCHANT_OVERRIDE" };
  if (params.fulfilment === "PICKUP") return { bps: config.commissionPickupBps, reason: "PICKUP" };
  const base =
    params.category === "FOOD" ? config.commissionRestaurantBps : config.commissionGroceryBps;
  const reason = params.category === "FOOD" ? "RESTAURANT" : "GROCERY_RETAIL";
  if (config.introCommissionEnabled && params.isIndependent && params.introRateStartedAt) {
    const end = new Date(params.introRateStartedAt);
    end.setMonth(end.getMonth() + config.introCommissionMonths);
    const now = params.now ?? new Date();
    // Intro rate is a discount: only applies while active and when lower than the default
    if (now >= params.introRateStartedAt && now < end && config.introCommissionBps < base) {
      return { bps: config.introCommissionBps, reason: "INTRO_INDEPENDENT" };
    }
  }
  return { bps: base, reason };
}

export function commissionCents(itemTotalCents: number, bps: number): number {
  return Math.round((itemTotalCents * bps) / 10000);
}

export function courierPay(params: {
  km: number;
  extraDrops?: number;
  peakFeeCents?: number;
  tipCents?: number;
  config: PricingConfig;
}) {
  const { config } = params;
  const extraKm = Math.max(0, Math.ceil(params.km - config.courierBaseCoversKm - 1e-9));
  const baseCents = config.courierBaseCents;
  const distanceCents = extraKm * config.courierPerKmCents;
  const batchCents = Math.max(0, params.extraDrops ?? 0) * config.courierBatchDropCents;
  const peakCents = params.peakFeeCents ?? 0;
  const tipCents = params.tipCents ?? 0; // tips pass 100% to the courier
  return {
    baseCents,
    distanceCents,
    batchCents,
    peakCents,
    tipCents,
    totalCents: baseCents + distanceCents + batchCents + peakCents + tipCents,
  };
}

export type PriceQuoteInput = {
  itemTotalCents: number;
  category: PricingCategory;
  distanceKm: number;
  distanceSource?: DistanceSource;
  hasPlus?: boolean;
  tipCents?: number;
  /** Clock used for scheduled peak windows (defaults to now). */
  now?: Date;
  config: PricingConfig;
};

export type PriceQuote = {
  itemTotalCents: number;
  distanceKm: number;
  distanceSource: DistanceSource;
  baseDeliveryFeeCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  smallOrderFeeCents: number;
  peakFeeCents: number;
  tipCents: number;
  totalCents: number;
  minOrderCents: number;
  meetsMinimum: boolean;
  shortfallCents: number;
  plusApplied: boolean;
  notes: string[];
};

export function quoteOrder(input: PriceQuoteInput): PriceQuote {
  const { config } = input;
  if (!Number.isInteger(input.itemTotalCents) || input.itemTotalCents < 0) {
    throw new Error("Invalid item total");
  }
  const tipCents = Math.max(0, Math.round(input.tipCents ?? 0));
  const notes: string[] = [];
  const baseDelivery = deliveryFeeForDistance(input.distanceKm, config);
  let deliveryFeeCents = baseDelivery;
  let serviceFeeCents = config.serviceFeeCents;

  const plus = Boolean(input.hasPlus && config.plusEnabled);
  let plusApplied = false;
  if (plus) {
    serviceFeeCents = 0;
    plusApplied = true;
    notes.push("THUMA Plus: no service fee");
    const plusMin =
      input.category === "FOOD" ? config.plusFoodMinCents : config.plusGroceryMinCents;
    if (input.distanceKm <= config.plusFreeDeliveryMaxKm && input.itemTotalCents > plusMin) {
      deliveryFeeCents = 0;
      notes.push("THUMA Plus: free delivery");
    }
  }
  if (serviceFeeCents > 0 && input.itemTotalCents > config.serviceFeeWaiverOverCents) {
    serviceFeeCents = 0;
    notes.push("Service fee waived on large basket");
  }
  const smallOrderFeeCents =
    input.itemTotalCents < config.smallOrderUnderCents ? config.smallOrderFeeCents : 0;
  const peakFeeCents = isPeakActive(config, input.now) ? config.peakFeeCents : 0;
  const minOrderCents = minimumOrderCents(input.category, config);

  return {
    itemTotalCents: input.itemTotalCents,
    distanceKm: input.distanceKm,
    distanceSource: input.distanceSource ?? "HAVERSINE",
    baseDeliveryFeeCents: baseDelivery,
    deliveryFeeCents,
    serviceFeeCents,
    smallOrderFeeCents,
    peakFeeCents,
    tipCents,
    totalCents:
      input.itemTotalCents +
      deliveryFeeCents +
      serviceFeeCents +
      smallOrderFeeCents +
      peakFeeCents +
      tipCents,
    minOrderCents,
    meetsMinimum: input.itemTotalCents >= minOrderCents,
    shortfallCents: Math.max(0, minOrderCents - input.itemTotalCents),
    plusApplied,
    notes,
  };
}
