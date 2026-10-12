import { prisma } from "@/lib/db";
import {
  formatDistanceKm,
  LatLng,
  nearestMerchantsWithinRadius,
  resolveCustomerOrigin,
} from "@/lib/geo";

export async function getNearbyApprovedMerchants(params: {
  zoneId?: string | null;
  zoneBoundaryJson?: string | null;
  addressLat?: number | null;
  addressLng?: number | null;
  /** When already resolved by the caller */
  origin?: LatLng;
  radiusKm?: number;
  originSource?: "address" | "zone_center";
}) {
  const resolved =
    params.origin && params.radiusKm != null
      ? {
          origin: params.origin,
          source: params.originSource ?? ("zone_center" as const),
          radiusKm: params.radiusKm,
        }
      : resolveCustomerOrigin({
          addressLat: params.addressLat,
          addressLng: params.addressLng,
          zoneBoundaryJson: params.zoneBoundaryJson,
        });

  const merchants = await prisma.merchant.findMany({
    where: {
      status: "APPROVED",
      ...(params.zoneId ? { zoneId: params.zoneId } : {}),
    },
  });

  const nearby = nearestMerchantsWithinRadius(
    merchants,
    resolved.origin,
    resolved.radiusKm,
  );

  return {
    origin: resolved.origin,
    originSource: resolved.source,
    radiusKm: resolved.radiusKm,
    merchants: nearby.map((m) => ({
      ...m,
      distanceLabel:
        m.distanceKm == null
          ? "Distance unknown"
          : formatDistanceKm(m.distanceKm),
    })),
    merchantIds: nearby.map((m) => m.id),
  };
}
