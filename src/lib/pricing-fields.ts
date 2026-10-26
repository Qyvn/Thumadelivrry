import type { PricingConfig } from "./pricing";

export type PricingFieldUnit = "rand" | "percent" | "km" | "months" | "toggle";
export type PricingField = { key: keyof PricingConfig; label: string; unit: PricingFieldUnit; help?: string };

export const PRICING_SECTIONS: { title: string; description: string; fields: PricingField[] }[] = [
  {
    title: "Delivery fee by distance",
    description:
      "Distance is merchant → customer straight-line (haversine) when both have map pins; otherwise zone centre → customer; otherwise the fallback distance.",
    fields: [
      { key: "deliveryBand1MaxKm", label: "Band 1 up to", unit: "km" },
      { key: "deliveryBand1Cents", label: "Band 1 fee", unit: "rand" },
      { key: "deliveryBand2MaxKm", label: "Band 2 up to", unit: "km" },
      { key: "deliveryBand2Cents", label: "Band 2 fee", unit: "rand" },
      { key: "deliveryBand3MaxKm", label: "Band 3 up to", unit: "km" },
      { key: "deliveryBand3Cents", label: "Band 3 fee", unit: "rand" },
      { key: "deliveryPerKmBeyondCents", label: "Per km beyond band 3", unit: "rand" },
      { key: "deliveryFeeCapCents", label: "Delivery fee cap", unit: "rand" },
      { key: "fallbackDistanceKm", label: "Fallback distance (no coordinates)", unit: "km" },
    ],
  },
  {
    title: "Customer fees & minimums",
    description: "Service fee, small-order fee, minimum order by merchant category, optional peak fee.",
    fields: [
      { key: "serviceFeeCents", label: "Service fee", unit: "rand" },
      { key: "serviceFeeWaiverOverCents", label: "Waive service fee on baskets over", unit: "rand" },
      { key: "smallOrderFeeCents", label: "Small-order fee", unit: "rand" },
      { key: "smallOrderUnderCents", label: "Small-order fee applies under", unit: "rand" },
      { key: "minOrderFoodCents", label: "Minimum order — food", unit: "rand" },
      { key: "minOrderGroceryCents", label: "Minimum order — grocery / retail", unit: "rand" },
      { key: "peakFeeEnabled", label: "Peak fee enabled", unit: "toggle", help: "Off by default. Passed 100% to courier." },
      { key: "peakFeeCents", label: "Peak fee", unit: "rand" },
    ],
  },
  {
    title: "Merchant commission",
    description: "Defaults by category. A per-merchant override (if set) wins.",
    fields: [
      { key: "commissionRestaurantBps", label: "Restaurants", unit: "percent" },
      { key: "commissionGroceryBps", label: "Grocery / retail", unit: "percent" },
      { key: "commissionPickupBps", label: "Pickup orders", unit: "percent" },
      { key: "introCommissionEnabled", label: "Intro rate for independents", unit: "toggle" },
      { key: "introCommissionBps", label: "Intro rate", unit: "percent" },
      { key: "introCommissionMonths", label: "Intro rate duration", unit: "months" },
    ],
  },
  {
    title: "Courier pay",
    description: "Tips always go 100% to the courier.",
    fields: [
      { key: "courierBaseCents", label: "Base pay per delivery", unit: "rand" },
      { key: "courierBaseCoversKm", label: "Base covers first", unit: "km" },
      { key: "courierPerKmCents", label: "Per km after that", unit: "rand" },
      { key: "courierBatchDropCents", label: "Per extra batched drop", unit: "rand" },
    ],
  },
  {
    title: "THUMA Plus",
    description: "Subscription is modelled only — members are NOT billed yet (no payment gateway connected).",
    fields: [
      { key: "plusEnabled", label: "Plus benefits enabled", unit: "toggle" },
      { key: "plusMonthlyPriceCents", label: "Monthly price", unit: "rand" },
      { key: "plusFreeDeliveryMaxKm", label: "Free delivery up to", unit: "km" },
      { key: "plusFoodMinCents", label: "Free delivery on food orders over", unit: "rand" },
      { key: "plusGroceryMinCents", label: "Free delivery on grocery orders over", unit: "rand" },
    ],
  },
];

export function toDisplay(unit: PricingFieldUnit, value: number): string {
  if (unit === "rand") return (value / 100).toFixed(2);
  if (unit === "percent") return (value / 100).toFixed(2);
  return String(value);
}

/** Parse a submitted form value back into the stored unit; throws on invalid input. */
export function fromForm(unit: PricingFieldUnit, raw: FormDataEntryValue | null): number | boolean {
  if (unit === "toggle") return raw === "on" || raw === "true";
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 0) throw new Error("Values must be non-negative numbers");
  if (unit === "rand" || unit === "percent") return Math.round(n * 100);
  if (unit === "months") return Math.round(n);
  return n;
}
