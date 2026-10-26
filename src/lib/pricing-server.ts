import { prisma } from "./db";
import { parseZoneGeo } from "./geo";
import {
  estimateDistance,
  normalisePricingCategory,
  pricingFromSettings,
  quoteOrder,
  type PricingConfig,
} from "./pricing";

export async function loadPricingConfig(): Promise<PricingConfig> {
  const row = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  return pricingFromSettings(row);
}

export async function hasActivePlus(customerId: string): Promise<boolean> {
  const sub = await prisma.plusSubscription.findUnique({ where: { customerId } });
  return sub?.status === "ACTIVE";
}

type QuoteMerchant = {
  latitude: number | null;
  longitude: number | null;
  pricingCategory: string;
  zone?: { boundaryJson: string | null } | null;
};

/** Server-side quote for a basket against a delivery address (or none yet). */
export async function quoteForBasket(params: {
  customerId: string;
  itemTotalCents: number;
  merchant: QuoteMerchant | null;
  address?: { latitude: number | null; longitude: number | null } | null;
  zoneBoundaryJson?: string | null;
  tipCents?: number;
  config?: PricingConfig;
}) {
  const config = params.config ?? (await loadPricingConfig());
  const plus = await hasActivePlus(params.customerId);
  const zoneJson = params.merchant?.zone?.boundaryJson ?? params.zoneBoundaryJson;
  const distance = estimateDistance({
    merchant: params.merchant
      ? { lat: params.merchant.latitude ?? undefined, lng: params.merchant.longitude ?? undefined }
      : null,
    customer: params.address
      ? { lat: params.address.latitude ?? undefined, lng: params.address.longitude ?? undefined }
      : null,
    zoneCenter: parseZoneGeo(zoneJson).center ?? null,
    config,
  });
  const category = normalisePricingCategory(params.merchant?.pricingCategory);
  const quote = quoteOrder({
    itemTotalCents: params.itemTotalCents,
    category,
    distanceKm: distance.km,
    distanceSource: distance.source,
    hasPlus: plus,
    tipCents: params.tipCents,
    config,
  });
  return { quote, category, config, hasPlus: plus };
}
